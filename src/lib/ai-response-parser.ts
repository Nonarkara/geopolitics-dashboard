function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null && !Array.isArray(x);
}

export function parseOpenAiText(payload: unknown): string {
  if (!isRecord(payload)) return "";

  if (typeof payload.output_text === "string") return payload.output_text;

  if (!Array.isArray(payload.output)) return "";

  return payload.output
    .flatMap((entry) => {
      if (!isRecord(entry) || !Array.isArray(entry.content)) return [];
      return entry.content.flatMap((content) => {
        if (!isRecord(content)) return [];
        if (typeof content.text === "string") return [content.text];
        return [];
      });
    })
    .join("\n");
}

export function parseOllamaText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!isRecord(payload)) return "";

  // Ollama style: { message: { content: string } }
  const message = payload.message as unknown;
  if (isRecord(message) && typeof message.content === "string") return message.content;

  // Some Ollama responses may include `response` or `text`
  if (typeof (payload as any).response === "string") return (payload as any).response;
  if (typeof (payload as any).text === "string") return (payload as any).text;

  return "";
}

export function parseAiText(provider: "openai" | "ollama", payload: unknown): string {
  return provider === "openai" ? parseOpenAiText(payload) : parseOllamaText(payload);
}

export default parseAiText;
