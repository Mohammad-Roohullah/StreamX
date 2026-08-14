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

export { registerSchema, loginSchema };