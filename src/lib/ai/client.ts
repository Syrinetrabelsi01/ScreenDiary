import "server-only";
import { AnthropicProvider } from "./anthropic";
import type { AiProvider } from "./provider";

const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

// Returns null (rather than throwing) when no key is configured, so every
// caller can degrade to the "AI is not configured yet" message instead of a
// 500. Add another provider by branching on AI_PROVIDER here.
export function getAiProvider(): AiProvider | null {
  const providerName = process.env.AI_PROVIDER || "anthropic";

  if (providerName === "anthropic") {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) return null;
    const model = process.env.AI_MODEL || DEFAULT_ANTHROPIC_MODEL;
    return new AnthropicProvider(apiKey, model);
  }

  return null;
}
