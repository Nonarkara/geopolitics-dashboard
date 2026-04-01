/**
 * AI Narrative Generator — produces a 3-sentence situation summary
 * for the Thailand border command briefing.
 *
 * Uses signal archive data + escalation detection to build context,
 * then calls AI provider (OpenAI or Ollama) to generate narrative.
 * Falls back to a deterministic summary if AI is unavailable.
 */

import { querySignals, detectEscalation } from "./signal-archive";
import { getAiConfig } from "./ai-config";

// In-memory cache
let cachedNarrative: { narrative: string; generatedAt: string; signalCount: number } | null = null;
let cacheExpiresAt = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function generateNarrative(): Promise<{
  narrative: string;
  generatedAt: string;
  signalCount: number;
}> {
  // Return cache if fresh
  if (cachedNarrative && Date.now() < cacheExpiresAt) {
    return { ...cachedNarrative };
  }

  // 1. Query top signals from last 24h
  const from24h = new Date(Date.now() - 86400000).toISOString();
  const { signals, total } = await querySignals({
    from: from24h,
    limit: 30,
  });

  // 2. Get escalation status for all frontiers
  const [myanmar, cambodia, malaysia] = await Promise.all([
    detectEscalation("myanmar-frontier"),
    detectEscalation("cambodia-frontier"),
    detectEscalation("malaysia-frontier"),
  ]);

  // 3. Build prompt
  const signalSummary = signals.slice(0, 15).map((s) => ({
    title: s.title,
    region: s.region,
    severity: s.severity,
    type: s.signal_type,
    source: s.source_provider,
  }));

  const escalationSummary = [myanmar, cambodia, malaysia]
    .filter(Boolean)
    .map((e) => ({
      region: e!.region,
      todayCount: e!.todayCount,
      baselineAvg: e!.baselineAvg,
      ratio: e!.ratio,
      escalated: e!.escalated,
    }));

  const prompt = `You are a geopolitical intelligence analyst writing a situation summary for a Thailand border command briefing. Based on the signals below from the last 24 hours, write exactly 3 sentences.

Signals (${total} total, showing top 15):
${JSON.stringify(signalSummary, null, 2)}

Escalation status:
${JSON.stringify(escalationSummary, null, 2)}

Rules:
- Focus on what CHANGED, not what stayed the same
- Name specific regions (Myanmar frontier, Cambodia frontier, Malaysia frontier)
- Include numbers (fatalities, signal counts, refugee figures) when available
- Use professional intelligence briefing language
- Exactly 3 sentences, no more`;

  // 4. Call AI provider
  const fallback = buildFallbackNarrative(signals, total, [myanmar, cambodia, malaysia]);
  let narrative = fallback;

  const config = getAiConfig();

  if (config.enabled) {
    try {
      const openaiBase = config.openaiBase.replace(/\/$/, "");
      const ollamaHost = config.ollamaHost.replace(/\/$/, "");
      const timeoutMs = Math.max(config.timeoutMs, 8000); // narrative needs more time

      if (config.openaiKey) {
        try {
          const resp = await fetch(`${openaiBase}/v1/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${config.openaiKey}`,
            },
            body: JSON.stringify({
              model: config.openaiModel,
              messages: [{ role: "user", content: prompt }],
              max_tokens: 300,
              temperature: 0.3,
            }),
            signal: AbortSignal.timeout(timeoutMs),
          });
          if (resp.ok) {
            const data = await resp.json();
            const content = data.choices?.[0]?.message?.content?.trim();
            if (content) narrative = content;
          }
        } catch {
          /* fall through to Ollama */
        }
      }

      if (narrative === fallback) {
        // Try Ollama
        try {
          const resp = await fetch(`${ollamaHost}/api/generate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: config.ollamaModel,
              prompt,
              stream: false,
            }),
            signal: AbortSignal.timeout(timeoutMs),
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.response?.trim()) narrative = data.response.trim();
          }
        } catch {
          /* use fallback */
        }
      }
    } catch {
      /* use fallback */
    }
  }

  const result = {
    narrative,
    generatedAt: new Date().toISOString(),
    signalCount: total,
  };

  cachedNarrative = result;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;

  return result;
}

function buildFallbackNarrative(
  signals: { title: string; region?: string; fatalities?: number }[],
  total: number,
  escalations: (Awaited<ReturnType<typeof detectEscalation>>)[],
): string {
  const escalated = escalations.filter((e) => e?.escalated);
  const topRegion = signals[0]?.region ?? "the border region";
  const fatalities = signals.reduce((sum, s) => sum + (s.fatalities || 0), 0);

  if (escalated.length > 0) {
    return `${escalated.length} frontier(s) showing elevated activity \u2014 ${escalated.map((e) => e!.region).join(", ")} at ${escalated.map((e) => `${e!.ratio}x baseline`).join(", ")}. ${total} signals processed in the last 24 hours with ${fatalities} reported fatalities across all theatres. Recommend maintaining heightened posture on ${topRegion} pending next assessment cycle.`;
  }

  return `${total} signals processed across all three frontiers in the last 24 hours, with activity within normal baseline parameters. ${fatalities > 0 ? `${fatalities} fatalities reported, concentrated around ${topRegion}.` : "No fatalities reported."} Command posture remains at current levels pending routine reassessment.`;
}
