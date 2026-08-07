import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL } from "./models.js";

export type TokenAccumulator = {
  inputTokens: number;
  outputTokens: number;
};

export function createTokenAccumulator(): TokenAccumulator {
  return { inputTokens: 0, outputTokens: 0 };
}

export function addUsage(acc: TokenAccumulator, usage?: Anthropic.Messages.Usage | null) {
  if (!usage) return;
  acc.inputTokens += usage.input_tokens ?? 0;
  acc.outputTokens += usage.output_tokens ?? 0;
}

function createClient(apiKey: string) {
  return new Anthropic({ apiKey });
}

export async function getReviewType(diff: string, apiKey: string, usage?: TokenAccumulator) {
  const anthropic = createClient(apiKey);
  const diffPreview = diff.slice(0, 3000);
  const prompt = `Identify the PR type from this code diff snippet. Return ONLY one word: feature | bugfix | refactor\n\n${diffPreview}`;
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 16,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  addUsage(usage ?? createTokenAccumulator(), res.usage);
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim().toLowerCase() : "";
}

export async function getCodeDiff(diff: string) {
  return diff
    .split("\n")
    .filter((line) => line.startsWith("+"))
    .join(" ")
    .slice(0, 500);
}

export async function generateRelevantSearchQuery(
  processedDiff: string,
  apiKey: string,
  usage?: TokenAccumulator,
) {
  const anthropic = createClient(apiKey);
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 100,
    temperature: 0,
    system:
      "Convert the given git diff into a short semantic search query  to find relevant code in a repository Return ONLY a short phrase.",
    messages: [
      {
        role: "user",
        content: processedDiff,
      },
    ],
  });
  addUsage(usage ?? createTokenAccumulator(), res.usage);
  const block = res.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

export async function getAIReview(
  prompt: string | null,
  apiKey: string,
  usage?: TokenAccumulator,
  retries = 4,
) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await _callAI(prompt, apiKey, usage);
    } catch (err: any) {
      if (err?.status === 529 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(
          `Anthropic overloaded (529), retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries})`,
        );
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded for AI review");
}

async function _callAI(prompt: string | null, apiKey: string, usage?: TokenAccumulator) {
  const anthropic = createClient(apiKey);
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    temperature: 0,
    system: `You are a normal, thoughtful engineer reviewing a teammate's pull request — knowledgeable, but you don't write like a robot.

Write "summary", "problem", and "fix" the way a real person would leave a comment on a diff: conversational, relatable, specific. Not a formal essay, not a customer-support script.

TONE & STYLE (match this closely):
- Tie every comment to a concrete consequence ("this can throw when the session expires"), not a vague rule.
- Suggest a fix, don't just point out the problem.
- When the intent is unclear, ask a question instead of assuming ("Can you help me understand why...?").
- Keep each comment to ONE or TWO short sentences — be concise when the point is simple, don't over-explain it.
- Don't reach for the same sentence shape every time. Vary it like a person would.
- Avoid stock connector words like "however", "on the other hand", "nevertheless" — just say the next thing.
- Keep the tone balanced: not overly cheerful, not overly formal or stiff.
- If you're not fully sure something is actually a problem, say so ("might be worth checking" / "not 100% sure but...") instead of stating it like a fact.
- It is completely fine to find nothing major. Do NOT invent issues to look thorough.
- Acknowledge good work when it's there, briefly — don't flatter, just note it plainly. Stay constructive, never strict or pedantic.

WHAT TO REVIEW:
- Real bugs and correctness issues
- Security risks (injection, secrets, unsafe input)
- Performance problems (N+1, work inside loops, heavy ops)
- Readability & maintainability (naming, duplication, clarity)
- Repository-specific rules (provided separately) take priority over general preferences.

RULES:
- Only comment on code that appears in the diff. Never hallucinate files or lines.
- Don't nitpick formatting or trivial style.
- Let severity signal how much something matters:
  - high → likely bug or security risk, should fix before merge
  - medium → worth fixing, potential issue or smell
  - low → minor / nit / readability, non-blocking

CATEGORIES: security | performance | quality | maintainability

SCORING (start at 100, deduct per issue):
- high → -10, medium → -5, low → -2

For each issue:
- "problem": one short, conversational sentence on the issue and why it matters.
- "fix": one short, concrete suggestion.

Return ONLY valid JSON in this exact format:

{
  "summary": "1-2 friendly sentences on the overall change; note what's good and the general direction",
  "score": number (0-100),
  "issues": [
    {
      "file": "file path",
      "line": number,
      "category": "security | performance | quality | maintainability",
      "severity": "low | medium | high",
      "problem": "short, human, consequence-focused note",
      "fix": "short, concrete suggestion"
    }
  ]
}

Do NOT include markdown, explanations, or any text outside the JSON.`,
    messages: [
      {
        role: "user",
        content: prompt ? prompt : "",
      },
    ],
  });
  addUsage(usage ?? createTokenAccumulator(), res.usage);

  if (res.stop_reason === "max_tokens") {
    console.warn("AI review response was truncated (max_tokens reached)");
  }

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text")
    throw new Error("No text block in AI response");
  return block.text;
}

type RelevantCodeMatch = {
  id: string
  score: number
  content: string
  filePath: string
  nodeType?: string
  symbolName?: string
  startLine?: number
  endLine?: number
}

function formatRelevantCode(matches: RelevantCodeMatch[]): string {
  if (!matches.length) return "";
  return matches
    .map((m) => {
      const header = [
        m.symbolName ? `// ${m.filePath} — ${m.symbolName} (${m.nodeType ?? "symbol"})` : `// ${m.filePath}`,
        m.startLine && m.endLine ? `// Lines ${m.startLine}-${m.endLine}` : null,
      ]
        .filter(Boolean)
        .join("\n")
      return `${header}\n${m.content}`
    })
    .join("\n\n---\n\n")
}

const MAX_DIFF_CHARS = 80_000;

export function reviewPrompt(
  diff: string,
  rules: any,
  relevantCode?: RelevantCodeMatch[] | string,
) {
  const relevantSection =
    Array.isArray(relevantCode) && relevantCode.length > 0
      ? `\nEXISTING CODEBASE CONTEXT (retrieved for this feature):\nUse this to check for consistency, duplication, or conflicts with existing patterns.\n\n${formatRelevantCode(relevantCode)}\n`
      : "";

  const truncatedDiff =
    diff.length > MAX_DIFF_CHARS
      ? `${diff.slice(0, MAX_DIFF_CHARS)}\n\n[... diff truncated at ${MAX_DIFF_CHARS} chars ...]`
      : diff;

  return `
REPOSITORY RULES (HIGHEST PRIORITY):
${JSON.stringify(rules, null, 2)}

GENERAL REVIEW GUIDELINES:

Check for:
- Security issues (SQL injection, XSS, secrets)
- Performance problems (loops, heavy operations)
- Code quality (long functions, nesting, bad logic)
- Maintainability (naming, duplication)
${relevantSection}
GIT DIFF:
${truncatedDiff}

Analyze ONLY the changed code.

Return strictly valid JSON.
`;
}

function extractJsonObject(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end > start) return text.slice(start, end + 1);

  return null;
}

export function parseAIResponse(text: string) {
  const candidates = [text.trim(), extractJsonObject(text)].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      return JSON.parse(candidate);
    } catch {
    }
  }

  console.log("❌ Failed to parse AI response");
  console.log("Response preview:", text.slice(0, 500));
  return null;
}
