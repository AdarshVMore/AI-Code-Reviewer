export type LLMProvider = "anthropic" | "openrouter";

/** Resolved credentials + target model for a single AI call. */
export type AIKeyConfig = {
  apiKey: string;
  provider: LLMProvider;
  model: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type ChatCompletionParams = {
  model: string;
  system?: string;
  messages: ChatMessage[];
  maxTokens: number;
  temperature?: number;
  disableReasoning?: boolean;
};

export type ChatCompletionResult = {
  text: string;
  stopReason: string | null;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
};

export interface ChatProvider {
  complete(params: ChatCompletionParams): Promise<ChatCompletionResult>;
}

/** True for transient upstream errors (rate limit / overload) worth retrying. */
export function isRetryableStatus(status: number | undefined): boolean {
  return status === 429 || status === 502 || status === 503 || status === 524 || status === 529;
}
