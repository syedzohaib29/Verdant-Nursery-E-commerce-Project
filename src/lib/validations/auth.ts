import { z } from "zod";

import { emailSchema, nameSchema, phoneSchema } from "@/lib/validations/shared";

/*
  Auth schemas.

  Password rules are deliberately modest. Length does more work than symbol
  classes, and a rule that rejects a passphrase is a rule that pushes people onto
  reused passwords.
*/

export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

const passwordShape = z
  .string()
  .min(MIN_PASSWORD_LENGTH, "Use at least 8 characters.")
  .max(MAX_PASSWORD_LENGTH, "That password is too long.");

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordShape,
    confirmPassword: z.string(),
    phone: phoneSchema.optional().or(z.literal("")),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  // No length rule on sign-in: an old password that no longer meets the signup
  // rule must still be able to get in and change itself.
  password: z.string().min(1, "Enter your password."),
});

export type LoginInput = z.infer<typeof loginSchema>;

/** Changing a password requires proving you know the current one. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: passwordShape,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Those passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine((values) => values.newPassword !== values.currentPassword, {
    message: "That is the password you already have.",
    path: ["newPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/** Profile edits. Email is separate because changing it is a deliberate act. */
export const updateProfileSchema = z.object({
  name: nameSchema,
  phone: phoneSchema.optional().or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const changeEmailSchema = z.object({
  email: emailSchema,
  currentPassword: z.string().min(1, "Enter your password to confirm."),
});

export type ChangeEmailInput = z.infer<typeof changeEmailSchema>;
