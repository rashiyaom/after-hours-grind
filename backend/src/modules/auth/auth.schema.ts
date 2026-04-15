import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    password: z.string().min(8).max(128),
    role: z.enum(["STUDENT", "TRAINER"]).default("STUDENT"),
    collegeId: z.string().trim().min(1).max(64).optional(),
    height: z.coerce.number().positive().max(300).optional(),
    weight: z.coerce.number().positive().max(700).optional(),
    fitnessGoal: z.string().trim().min(1).max(120).optional(),
    specialization: z.string().trim().min(1).max(120).optional(),
    whatsappNumber: z.string().trim().min(8).max(32).optional(),
    experience: z.coerce.number().int().min(0).max(80).optional(),
    certifications: z.union([z.string(), z.array(z.string())]).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.role === "TRAINER" && !value.whatsappNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["whatsappNumber"],
        message: "WhatsApp number is required for trainer signup",
      });
    }
  });

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
