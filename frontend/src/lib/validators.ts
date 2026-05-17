import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const jdInputSchema = z.object({
  text: z
    .string()
    .min(50, "Job description must be at least 50 characters")
    .max(10000, "Job description must be under 10,000 characters"),
  sourceUrl: z.string().url().optional().or(z.literal("")),
});

export type JDInputFormData = z.infer<typeof jdInputSchema>;

export const contactInfoSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
});

export type ContactInfoFormData = z.infer<typeof contactInfoSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
