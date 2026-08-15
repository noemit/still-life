import { z } from "zod";

export const historyEntrySchema = z.object({
  query: z.string().trim().min(1).max(300),
  history: z
    .array(
      z.object({
        query: z.string().trim().min(1).max(300),
        title: z.string().trim().min(1).max(200),
      })
    )
    .max(50)
    .default([]),
});
