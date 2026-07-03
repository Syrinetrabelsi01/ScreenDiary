import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { AiProvider } from "./provider";

export class AnthropicProvider implements AiProvider {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete({
    system,
    prompt,
    maxTokens = 1024,
  }: {
    system: string;
    prompt: string;
    maxTokens?: number;
  }): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    return textBlock?.text.trim() ?? "";
  }
}
