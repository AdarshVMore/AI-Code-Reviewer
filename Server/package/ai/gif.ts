import Anthropic from "@anthropic-ai/sdk";
import { addUsage, createTokenAccumulator, type TokenAccumulator } from "./review.js";
import { CLAUDE_MODEL } from "./models.js";

export async function getGifName(
  summary: string | null | undefined,
  apiKey: string,
  usage?: TokenAccumulator,
): Promise<string> {
  const fallback = "code review";
  const cleanSummary = summary?.trim();

  if (!cleanSummary) return fallback;

  const anthropic = new Anthropic({ apiKey });
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
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
  addUsage(usage ?? createTokenAccumulator(), res.usage);

  const block = res.content.find((b) => b.type === "text");
  const text = block && block.type === "text" ? block.text.trim() : "";
  return text || fallback;
}
