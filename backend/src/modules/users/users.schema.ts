import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  // Student-specific
  collegeId: z.string().optional(),
  heightCm: z.coerce.number().positive().optional(),
  weightKg: z.coerce.number().positive().optional(),
  fitnessGoal: z.string().optional(),
  onboardingDraft: z.record(z.string(), z.unknown()).optional(),
  onboardingStep: z.coerce.number().int().optional(),
  onboardingCompleted: z.coerce.boolean().optional(),
  // Trainer-specific
  specialization: z.string().optional(),
  whatsappNumber: z.string().trim().min(8).max(32).optional(),
  experience: z.coerce.number().int().min(0).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
