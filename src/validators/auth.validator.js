import { z } from "zod";

const registerSchema = z.object({
  username: z.string().trim().toLowerCase().min(3, "Username must be at least 3 characters"),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  fullName: z.string().trim().min(1, "Full name is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const loginSchema = z.object({
  username: z.string().trim().optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address").optional(),
  password: z.string().min(1, "Password is required"),
}).refine((data) => data.username || data.email, {
  message: "Username or email is required",
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
});

const verifyOtpSchema = z.object({
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  otp: z.string().length(6, "Code must be 6 digits"),
});

const resetPasswordSchema = z.object({
  resetToken: z.string().min(1, "Reset token is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export { registerSchema, loginSchema, forgotPasswordSchema, verifyOtpSchema, resetPasswordSchema };