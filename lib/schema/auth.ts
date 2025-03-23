import { z } from "zod";

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

// Create user schema (for admin to create new users)
export const createUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "user"]).default("user"),
  is_active: z.boolean().default(true),
});

// Update user schema (for admin to update users)
export const updateUserSchema = z.object({
  id: z.string().uuid("Invalid user ID"),
  email: z.string().email("Please enter a valid email address").optional(),
  first_name: z.string().min(1, "First name is required").optional(),
  last_name: z.string().min(1, "Last name is required").optional(),
  role: z.enum(["admin", "user"]).optional(),
  is_active: z.boolean().optional(),
});

// Change password schema
export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Current password is required"),
    new_password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(72, "Password cannot exceed 72 characters"),
    confirm_password: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

// Reset password schema
export const resetPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

// Update notification preferences schema
export const updateNotificationPreferencesSchema = z.object({
  new_poll_notification: z.boolean(),
  reminder_notification: z.boolean(),
  results_notification: z.boolean(),
  reminder_hours: z.number().int().min(1).max(72),
});
