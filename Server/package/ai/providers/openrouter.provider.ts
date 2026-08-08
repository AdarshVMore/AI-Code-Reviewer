import type { ChatCompletionParams, ChatCompletionResult, ChatProvider } from "./types.js";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

/**
 * OpenRouter's REST API is OpenAI-chat-completions-shaped: POST /chat/completions
 * with { model, messages, max_tokens, temperature } and a `choices[0].message.content`
 * response. `model` is the OpenRouter model slug (e.g. "openai/gpt-4o",
 * "anthropic/claude-sonnet-4.5", "google/gemini-2.5-pro") — the user picks it.
 * https://openrouter.ai/docs/api-reference/chat-completion
 */
export class OpenRouterProvider implements ChatProvider {
  constructor(private apiKey: string) {}

  async complete(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    const messages = [
      ...(params.system ? [{ role: "system" as const, content: params.system }] : []),
      ...params.messages,
    ];

    const res = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_URL || "https://coderefyn.com",
        "X-OpenRouter-Title": "CodeRefyn",
      },
      body: JSON.stringify({
        model: params.model,
        max_tokens: params.maxTokens,
        temperature: params.temperature,
        messages,
        ...(params.disableReasoning ? { reasoning: { enabled: false } } : {}),
      }),
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => null)) as { error?: { message?: string } } | null;
      const message = body?.error?.message || `OpenRouter request failed with status ${res.status}`;
      const err = new Error(message) as Error & { status?: number };
      err.status = res.status;
      throw err;
    }

    const data = (await res.json()) as {
      model?: string;
      choices?: {
        message?: { content?: string; reasoning?: string };
        finish_reason?: string;
        native_finish_reason?: string;
      }[];
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };

    const choice = data.choices?.[0];
    const text = choice?.message?.content ?? "";

    if (!text) {
      // Empty content with a 200 is usually the model burning its whole
      // max_tokens budget on hidden reasoning before producing an answer.
      // Log everything OpenRouter gave us so this is diagnosable without
      // reproducing the call.
      console.warn(
        "[openrouter] empty content in response",
        JSON.stringify(
          {
            model: params.model,
            servedBy: data.model,
            finishReason: choice?.finish_reason,
            nativeFinishReason: choice?.native_finish_reason,
            hadReasoning: Boolean(choice?.message?.reasoning),
            reasoningPreview: choice?.message?.reasoning?.slice(0, 500),
            maxTokens: params.maxTokens,
            usage: data.usage,
          },
          null,
          2,
        ),
      );
    }

    return {
      text,
      stopReason: choice?.finish_reason ?? null,
      usage: {
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
      },
    };
  }
}
