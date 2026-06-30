import Anthropic from "@anthropic-ai/sdk";
import { addUsage, createTokenAccumulator, type TokenAccumulator } from "./review.js";
import { CLAUDE_MODEL } from "./models.js";

export type GifContext = {
  score?: number | null;
  highSeverityCount?: number;
  totalIssues?: number;
};

type Mood = "celebrate" | "approve" | "minor" | "needs-work";

const MOOD_FALLBACK: Record<Mood, string> = {
  celebrate: "celebration confetti",
  approve: "thumbs up approve",
  minor: "almost there",
  "needs-work": "needs more work",
};

const MOOD_HINT: Record<Mood, string> = {
  celebrate:
    "The PR is clean with no issues — pick a happy, celebratory, approving vibe.",
  approve:
    "The PR is solid with only minor notes — pick a positive, encouraging vibe.",
  minor:
    "The PR is mostly fine but has a few things to tidy up — pick a lighthearted 'almost there' vibe.",
  "needs-work":
    "The PR has real problems to address — pick a friendly, lighthearted 'needs some work' reaction (never mean).",
};

function resolveMood(context?: GifContext): Mood {
  const total = context?.totalIssues ?? 0;
  const high = context?.highSeverityCount ?? 0;
  const score = context?.score ?? null;

  if (high > 0 || (score !== null && score < 60)) return "needs-work";
  if (total === 0 && (score === null || score >= 90)) return "celebrate";
  if (total <= 2 && (score === null || score >= 80)) return "approve";
  return "minor";
}

export async function getGifName(
  summary: string | null | undefined,
  apiKey: string,
  usage?: TokenAccumulator,
  context?: GifContext,
): Promise<string> {
  const mood = resolveMood(context);
  const fallback = MOOD_FALLBACK[mood];
  const cleanSummary = summary?.trim();

  if (!cleanSummary) return fallback;

  const anthropic = new Anthropic({ apiKey });
  const res = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 40,
    temperature: 0.4,
    system: `Turn a code review into a short, fun Giphy search query that captures the MOOD of the review.
${MOOD_HINT[mood]}
Keep it relatable to developers. Return ONLY 2 to 5 simple words, no punctuation, no quotes.`,
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
