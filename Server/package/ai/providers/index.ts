import { AnthropicProvider } from "./anthropic.provider.js";
import { OpenRouterProvider } from "./openrouter.provider.js";
import type { ChatProvider, LLMProvider } from "./types.js";

export type {
  AIKeyConfig,
  ChatCompletionParams,
  ChatCompletionResult,
  ChatMessage,
  ChatProvider,
  LLMProvider,
} from "./types.js";
export { isRetryableStatus } from "./types.js";

export function createChatProvider(provider: LLMProvider, apiKey: string): ChatProvider {
  switch (provider) {
    case "anthropic":
      return new AnthropicProvider(apiKey);
    case "openrouter":
      return new OpenRouterProvider(apiKey);
    default:
      throw new Error(`Unsupported AI provider: ${provider}`);
  }
}
