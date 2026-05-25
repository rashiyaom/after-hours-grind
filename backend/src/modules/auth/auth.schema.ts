import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255),
    phoneNumber: z.string().trim().regex(/^\+?[0-9]{8,15}$/, "Invalid phone number format").optional(),
    password: z.string().min(8).max(128),
    role: z.preprocess(
      (value) => (typeof value === "string" ? value.toUpperCase() : value),
      z.enum(["STUDENT", "TRAINER"]).default("STUDENT")
    ),
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
    if (value.role === "STUDENT" && !value.phoneNumber?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phoneNumber"],
        message: "Phone number is required for signup",
      });
    }

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

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const forgotPasswordVerifyCodeSchema = z.object({
  email: z.string().trim().email(),
  code: z.string().trim().regex(/^\d{6}$/, "Code must be a 6-digit number"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20),
  newPassword: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ForgotPasswordVerifyCodeInput = z.infer<typeof forgotPasswordVerifyCodeSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
