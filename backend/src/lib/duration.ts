const DURATION_PATTERN = /^(\d+)\s*(ms|s|m|h|d)$/i;

const UNIT_TO_MS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

export const parseDurationToMs = (value: string, fallbackMs: number): number => {
  const normalized = value.trim().toLowerCase();
  const match = normalized.match(DURATION_PATTERN);
  if (!match) return fallbackMs;

  const amount = Number.parseInt(match[1], 10);
  const unit = match[2];
  const multiplier = UNIT_TO_MS[unit];

  if (!Number.isFinite(amount) || amount <= 0 || !multiplier) {
    return fallbackMs;
  }

  return amount * multiplier;
};
