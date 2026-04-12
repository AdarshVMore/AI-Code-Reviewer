import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function analyzeDeploymentLogs(logs: string, provider: string) {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    system: `You are a senior DevOps engineer analyzing CI/CD deployment failure logs.

Given raw build/deployment logs from ${provider}, identify the root cause of the failure.

Return ONLY valid JSON in this exact format:

{
  "cause": "short explanation of why it failed",
  "file": "the file that caused the failure if identifiable, otherwise null",
  "line": line number if identifiable otherwise null,
  "fix": "specific actionable fix to resolve the failure"
}

Do NOT include markdown or text outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `Here are the deployment logs:\n\n${logs}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in AI response");

  const clean = block.text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export async function generateDeploymentFix(fileContent: string, cause: string, fix: string, fileName: string) {
  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4000,
    system: `You are a senior software engineer. You will be given a file and a description of a bug causing a deployment failure. Apply the fix and return the complete corrected file content.

Return ONLY valid JSON in this exact format:

{
  "fixedContent": "the complete corrected file content as a string",
  "explanation": "one sentence explaining what you changed"
}

Do NOT include markdown or text outside the JSON.`,
    messages: [
      {
        role: "user",
        content: `File: ${fileName}\n\nCause: ${cause}\n\nFix to apply: ${fix}\n\nFile content:\n${fileContent}`,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("No text block in AI response");

  const clean = block.text.replace(/```json/g, "").replace(/```/g, "").trim();

  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}
