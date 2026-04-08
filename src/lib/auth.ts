export const PASSWORD_HASH_PREFIX = "ahg$";

// Frontend-only hash helper. This removes plaintext storage but is not a backend-grade auth substitute.
export const hashPassword = (password: string): string => {
  const source = `after-hours-grind::${password}`;
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  const unsigned = hash >>> 0;
  return `${PASSWORD_HASH_PREFIX}${unsigned.toString(16).padStart(8, "0")}`;
};

export const looksHashedPassword = (value: string | undefined): boolean =>
  typeof value === "string" && value.startsWith(PASSWORD_HASH_PREFIX);
