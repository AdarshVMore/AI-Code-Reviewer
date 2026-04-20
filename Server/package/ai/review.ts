import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function getAIReview(prompt: string | null, retries = 4) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await _callAI(prompt);
    } catch (err: any) {
      if (err?.status === 529 && attempt < retries) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s
        console.log(`Anthropic overloaded (529), retrying in ${delay / 1000}s... (attempt ${attempt + 1}/${retries})`);
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw new Error("Max retries exceeded for AI review");
}

async function _callAI(prompt: string | null) {
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

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in AI response");
  return block.text;
}

export function reviewPrompt(diff: string, rules: any) {
  return `
REPOSITORY RULES (HIGHEST PRIORITY):
${JSON.stringify(rules, null, 2)}

GENERAL REVIEW GUIDELINES:

Check for:
- Security issues (SQL injection, XSS, secrets)
- Performance problems (loops, heavy operations)
- Code quality (long functions, nesting, bad logic)
- Maintainability (naming, duplication)

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
