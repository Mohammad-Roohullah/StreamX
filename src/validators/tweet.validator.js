import { z } from "zod";

const createTweetSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(200),
});

const updateTweetSchema = z.object({
  content: z.string().trim().min(1).max(200).optional(),
});

export { createTweetSchema, updateTweetSchema };