// Provider-agnostic interface — swap in a different AI vendor later by adding
// a new file that implements this and wiring it up in client.ts, without
// touching any of the Server Actions that call complete().
export interface AiProvider {
  complete(params: { system: string; prompt: string; maxTokens?: number }): Promise<string>;
}
