import Anthropic from "@anthropic-ai/sdk";
import type { ChatCompletionParams, ChatCompletionResult, ChatProvider } from "./types.js";

export class AnthropicProvider implements ChatProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async complete(params: ChatCompletionParams): Promise<ChatCompletionResult> {
    const res = await this.client.messages.create({
      model: params.model,
      max_tokens: params.maxTokens,
      temperature: params.temperature,
      system: params.system,
      messages: params.messages,
      // Newer Claude models (Opus 5+) think by default even without this
      // param; only set it when explicitly asked so older models are unaffected.
      ...(params.disableReasoning ? { thinking: { type: "disabled" as const } } : {}),
    });

    const block = res.content.find((b) => b.type === "text");

    return {
      text: block && block.type === "text" ? block.text : "",
      stopReason: res.stop_reason,
      usage: {
        inputTokens: res.usage?.input_tokens ?? 0,
        outputTokens: res.usage?.output_tokens ?? 0,
      },
    };
  }
}
