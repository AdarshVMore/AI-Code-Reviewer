import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function getAIReview(prompt: string | null) {
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

  return res.content;
}

export function reviewPrompt(diff: string, rules: any) {
    console.log("rules =>>>>>>>" , rules)
    console.log("difference =>>>>>>", diff)
    const rule = JSON.stringify(rules, null, 2)
    console.log("phase 1 rule", rule)
    const prompt = ` ${rule} Analyze this git diff: ${diff} Return ONLY valid JSON in this format: {"summary": "short summary","issues": [  {    "file": "file path",    "line": number,    "problem": "what is wrong",    "fix": "suggested fix"  }]}`
    console.log("phase 2 prompt", prompt)
    return prompt;
}

export function parseAIResponse(text: string) {
  try {
    return text
  } catch (err) {
    console.log("❌ Failed to parse AI response");
    return null;
  }
}