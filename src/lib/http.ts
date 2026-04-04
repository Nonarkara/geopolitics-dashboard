interface AbortSignalConstructorWithTimeout {
  timeout?: (milliseconds: number) => AbortSignal;
}

interface IntegerParamOptions {
  defaultValue: number;
  min?: number;
  max?: number;
}

export function getTimeoutSignal(
  timeoutMs: number,
): AbortSignal | undefined {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined;
  }

  if (typeof AbortSignal === "undefined") {
    return undefined;
  }

  const abortSignalConstructor =
    AbortSignal as AbortSignalConstructorWithTimeout;

  return typeof abortSignalConstructor.timeout === "function"
    ? abortSignalConstructor.timeout(timeoutMs)
    : undefined;
}

export function parseIntegerParam(
  value: unknown,
  { defaultValue, min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER }: IntegerParamOptions,
) {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number.parseInt(value, 10)
        : Number.NaN;

  if (!Number.isFinite(parsed)) {
    return defaultValue;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export function createRequestId(prefix = "api") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
