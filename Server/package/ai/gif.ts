import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function getGifName(summary?: string | null): Promise<string> {
  const fallback = "code review";
  const cleanSummary = summary?.trim();

  if (!cleanSummary) return fallback;

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 40,
    temperature: 0,
    system:
      "Turn a code review summary into a short Giphy search query. Return only 2 to 5 simple words, no punctuation.",
    messages: [
      {
        role: "user",
        content: cleanSummary,
      },
    ],
  });

  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text.trim() : "";
  return text || fallback;
}
