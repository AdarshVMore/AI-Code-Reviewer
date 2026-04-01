import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function getAIReview(prompt: string) {
  const res = await anthropic.messages.create({
    model: "claude-3-5-sonnet-latest",
    max_tokens: 1500,
    temperature: 0,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  return res.content;
}

export function reviewPrompt(diff: string, rules: any) {
    console.log("rules =>>>>>>>" , rules)
    console.log("difference =>>>>>>", diff)
    
  return `
${JSON.stringify(rules, null, 2)}

Analyze this git diff:

${diff}

Return ONLY valid JSON in this format:

{
  "summary": "short summary",
  "issues": [
    {
      "file": "file path",
      "line": number,
      "problem": "what is wrong",
      "fix": "suggested fix"
    }
  ]
}
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