import { z } from "zod";

// Poll option schema
export const pollOptionSchema = z.object({
  option_text: z
    .string()
    .min(1, "Option text is required")
    .max(200, "Option text cannot exceed 200 characters"),
});

// Poll media schema
export const pollMediaSchema = z
  .object({
    media_type: z.enum(["image", "document", "link"]),
    storage_path: z.string().optional().nullable(),
    media_url: z.string().url("Please enter a valid URL").optional().nullable(),
    description: z
      .string()
      .max(500, "Description cannot exceed 500 characters")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Ensure either storage_path or media_url is provided based on media_type
      if (data.media_type === "link") {
        return !!data.media_url;
      } else {
        return !!data.storage_path;
      }
    },
    {
      message:
        "Either storage path or media URL must be provided based on media type",
      path: ["media_url", "storage_path"],
    }
  );

// Create poll schema
export const createPollSchema = z
  .object({
    title: z
      .string()
      .min(3, "Title must be at least 3 characters")
      .max(100, "Title cannot exceed 100 characters"),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .optional(),
    status: z.enum(["draft", "scheduled", "active", "closed"]).default("draft"),
    start_time: z.string().datetime().optional().nullable(),
    end_time: z.string().datetime().optional().nullable(),
    options: z
      .array(pollOptionSchema)
      .min(2, "At least 2 options are required"),
    media: z.array(pollMediaSchema).optional(),
  })
  .refine(
    (data) => {
      // If status is 'scheduled' or 'active', start_time is required
      if (["scheduled", "active"].includes(data.status)) {
        return !!data.start_time;
      }
      return true;
    },
    {
      message: "Start time is required for scheduled or active polls",
      path: ["start_time"],
    }
  )
  .refine(
    (data) => {
      // If end_time is provided, it must be after start_time
      if (data.start_time && data.end_time) {
        return new Date(data.end_time) > new Date(data.start_time);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["end_time"],
    }
  );

// Update poll schema (similar to create but with partial fields)
export const updatePollSchema = z.object({
  // ID is required for updates
  id: z.string().uuid("Invalid poll ID"),
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title cannot exceed 100 characters")
    .optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .optional()
    .nullable(),
  status: z.enum(["draft", "scheduled", "active", "closed"]).optional(),
  start_time: z.string().datetime().optional().nullable(),
  end_time: z.string().datetime().optional().nullable(),
  options: z
    .array(pollOptionSchema)
    .min(2, "At least 2 options are required")
    .optional(),
  media: z.array(pollMediaSchema).optional(),
});
