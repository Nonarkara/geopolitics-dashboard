export interface AiConfig {
  preferLocal: boolean;
  enabled: boolean;
  openaiKey?: string;
  openaiBase: string;
  openaiModel: string;
  ollamaHost: string;
  ollamaModel: string;
  timeoutMs: number;
}

export function getAiConfig(): AiConfig {
  const preferLocal = (process.env.AI_PREFER_LOCAL ?? "true").toLowerCase() !== "false";
  const enabled = (process.env.ENABLE_AI_SUMMARIES ?? "true").toLowerCase() !== "false";
  const openaiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBase = process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com";
  const openaiModel = process.env.OPENAI_MODEL?.trim() || "gpt-4.1-mini";
  const ollamaHost = process.env.OLLAMA_HOST?.trim() || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL?.trim() || "qwen2.5-coder:7b";
  const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 5000);

  return {
    preferLocal,
    enabled,
    openaiKey,
    openaiBase,
    openaiModel,
    ollamaHost,
    ollamaModel,
    timeoutMs,
  };
}

export default getAiConfig;
