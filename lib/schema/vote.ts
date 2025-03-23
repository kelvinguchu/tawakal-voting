import { z } from "zod";

// Vote schema for casting votes
export const voteSchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
  option_id: z.string().uuid("Invalid option ID"),
});

// Schema for retrieving poll results
export const pollResultsQuerySchema = z.object({
  poll_id: z.string().uuid("Invalid poll ID"),
});
