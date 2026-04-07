export const LUXURY_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const LUXURY_SPRING = {
  type: "spring" as const,
  stiffness: 145,
  damping: 24,
  mass: 0.95,
};

export const LUXURY_TWEEN_MEDIUM = {
  duration: 0.5,
  ease: LUXURY_EASE,
} as const;

export const LUXURY_TWEEN_SLOW = {
  duration: 0.62,
  ease: LUXURY_EASE,
} as const;
