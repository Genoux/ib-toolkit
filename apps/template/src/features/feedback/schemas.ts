import { z } from "zod";

export const feedbackSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Write a message first")
    .max(1000, "Keep it under 1000 characters"),
});

export type FeedbackInput = z.input<typeof feedbackSchema>;
