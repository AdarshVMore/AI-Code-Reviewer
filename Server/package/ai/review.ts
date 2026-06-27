import Anthropic from "@anthropic-ai/sdk";

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

export async function getRevieType(diff: string, apiKey: string, usage?: TokenAccumulator) {
  const anthropic = createClient(apiKey);
  const prompt = `You are supposed to see the Code Diff ${diff} and identify the PR Type if it is a Bug Fix / New Feature / Code Update , etc and only return the name of the type in response . "Return ONLY: feature | bugfix | refactor"`;
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt ? prompt : "",
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
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
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
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    temperature: 0,
    system: `You are a strict senior software engineer performing code reviews.

Your job is to analyze git diffs and identify issues based on:

1. General engineering best practices
2. Security vulnerabilities
3. Performance problems
4. Maintainability and readability
5. Custom repository-specific rules (highest priority)

CRITICAL RULES:

- Repository-specific rules OVERRIDE general best practices
- Be strict and critical, not polite
- Focus ONLY on real issues (no fluff)
- Do NOT hallucinate files or lines
- Only comment on changed code (diff)

CLASSIFY every issue into:

Categories:
- security
- performance
- quality
- maintainability

Severity levels:
- high → can break system / security risk
- medium → bad practice / potential bug
- low → improvement / readability

SCORING RULE:

Start from 100 and deduct:
- high issue → -10
- medium issue → -5
- low issue → -2

FINAL OUTPUT:

Return ONLY valid JSON in this exact format:

{
  "summary": "short technical summary",
  "score": number (0-100),
  "issues": [
    {
      "file": "file path",
      "line": number,
      "category": "security | performance | quality | maintainability",
      "severity": "low | medium | high",
      "problem": "clear explanation",
      "fix": "actionable fix"
    }
  ]
}

Do NOT include markdown, explanations, or text outside JSON.`,
    messages: [
      {
        role: "user",
        content: prompt ? prompt : "",
      },
    ],
  });
  addUsage(usage ?? createTokenAccumulator(), res.usage);

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text")
    throw new Error("No text block in AI response");
  return block.text;
}

type RelevantCodeMatch = {
  id: string;
  score: number;
  content: string;
  filePath: string;
};

function formatRelevantCode(matches: RelevantCodeMatch[]): string {
  if (!matches.length) return "";
  return matches
    .map((m) => `// ${m.filePath}\n${m.content}`)
    .join("\n\n---\n\n");
}

export function reviewPrompt(
  diff: string,
  rules: any,
  relevantCode?: RelevantCodeMatch[] | string,
) {
  const relevantSection =
    Array.isArray(relevantCode) && relevantCode.length > 0
      ? `\nEXISTING CODEBASE CONTEXT (retrieved for this feature):\nUse this to check for consistency, duplication, or conflicts with existing patterns.\n\n${formatRelevantCode(relevantCode)}\n`
      : "";

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
${diff}

Analyze ONLY the changed code.

Return strictly valid JSON.
`;
}

export function parseAIResponse(text: string) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.log("❌ Failed to parse AI response");
    return null;
  }
}
