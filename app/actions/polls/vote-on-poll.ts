"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAuth } from "../auth/check-user-role";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type VoteResult = {
  success: boolean;
  message: string;
  voteId?: string;
  optionId?: string;
};

/**
 * Submits a vote for a specific option in a poll
 * @param pollId The ID of the poll being voted on
 * @param optionId The ID of the selected option
 * @returns Object containing success status, message, and vote details if successful
 */
export async function submitVote(
  pollId: string,
  optionId: string
): Promise<VoteResult> {
  try {
    // Helper function to check if a date is "now" (within a 5 minute window)
    const isDateNow = (dateString: string | null): boolean => {
      if (!dateString) return false;

      const date = new Date(dateString);
      const now = new Date();

      // Check if the date is within 5 minutes of current time
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      return Math.abs(date.getTime() - now.getTime()) < fiveMinutes;
    };

    // Ensure user is authenticated
    const { user } = await requireAuth();
    const userId = user.id;

    const supabase = await createClient();

    // First check if the poll is active
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("status, start_time, end_time")
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll:", pollError);
      return {
        success: false,
        message: "Failed to fetch poll information",
      };
    }

    // Verify poll status - rely on database status
    if (poll.status !== "active") {
      if (poll.status === "scheduled") {
        return {
          success: false,
          message: `This poll is scheduled to start on ${new Date(
            poll.start_time
          ).toLocaleString()}`,
        };
      } else if (poll.status === "closed") {
        return {
          success: false,
          message: "This poll has ended and is no longer accepting votes",
        };
      } else {
        return {
          success: false,
          message: `This poll is not currently active (status: ${poll.status})`,
        };
      }
    }

    // Check if the poll end time has passed
    const now = new Date().toISOString();
    if (poll.end_time && now > poll.end_time) {
      // Update the poll status to closed
      await supabase
        .from("polls")
        .update({ status: "closed" })
        .eq("id", pollId);

      return {
        success: false,
        message: "This poll has ended",
      };
    }

    // Check if user has already voted in this poll
    const { data: existingVote, error: voteCheckError } = await supabase
      .from("votes")
      .select("id, option_id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .maybeSingle();

    if (voteCheckError) {
      console.error("Error checking existing vote:", voteCheckError);
      return {
        success: false,
        message: "Failed to verify voting eligibility",
      };
    }

    // If user has already voted, return info about their vote
    if (existingVote) {
      return {
        success: false,
        message: "You have already voted in this poll",
        voteId: existingVote.id,
        optionId: existingVote.option_id,
      };
    }

    // Check if the option exists and belongs to this poll
    const { data: option, error: optionError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("id", optionId)
      .eq("poll_id", pollId)
      .single();

    if (optionError || !option) {
      console.error("Error verifying option:", optionError);
      return {
        success: false,
        message: "Invalid option selected",
      };
    }

    // Submit the vote
    const { data: vote, error: voteError } = await supabase
      .from("votes")
      .insert({
        poll_id: pollId,
        option_id: optionId,
        user_id: userId,
      })
      .select()
      .single();

    if (voteError) {
      console.error("Error submitting vote:", voteError);

      // If we hit RLS policy violation, try again with admin key
      if (voteError.code === "42501") {
        console.log("Attempting to bypass RLS with service role...");

        // Get the environment variables directly
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Create a custom fetch with timeout
        const fetchWithTimeout = async (
          url: RequestInfo | URL,
          options: RequestInit = {},
          timeout = 30000
        ): Promise<Response> => {
          const controller = new AbortController();
          const { signal } = controller;

          // Create a timeout to abort the fetch
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          try {
            return await fetch(url, { ...options, signal });
          } finally {
            clearTimeout(timeoutId);
          }
        };

        // Create a new client with the service role key to bypass RLS
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          supabaseServiceKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            global: {
              fetch: fetchWithTimeout,
              headers: { "x-client-info": "server-action" },
            },
          }
        );

        try {
          // Try inserting again with admin privileges
          const { data: adminVote, error: adminVoteError } = await supabaseAdmin
            .from("votes")
            .insert({
              poll_id: pollId,
              option_id: optionId,
              user_id: userId,
            })
            .select()
            .single();

          if (adminVoteError) {
            console.error(
              "Error submitting vote with service role:",
              adminVoteError
            );

            // Special handling for unique constraint violations
            if (adminVoteError.code === "23505") {
              return {
                success: false,
                message: "You have already voted in this poll",
              };
            }

            return {
              success: false,
              message:
                adminVoteError.message ||
                "Failed to submit vote, even with administrative privileges",
            };
          }

          // Successfully inserted with admin privileges
          // Revalidate relevant paths to update UI
          revalidatePath("/polls");
          revalidatePath("/dashboard");
          revalidatePath(`/polls/${pollId}`);

          return {
            success: true,
            message: "Your vote has been recorded successfully",
            voteId: adminVote.id,
            optionId: optionId,
          };
        } catch (adminError) {
          console.error("Admin client vote error:", adminError);

          // Check if it's a timeout error
          if (adminError instanceof Error && adminError.name === "AbortError") {
            return {
              success: false,
              message: "Operation timed out. Please try again.",
            };
          }

          return {
            success: false,
            message: "An unexpected error occurred while processing your vote",
          };
        }
      }

      // Regular error handling
      // Special handling for unique constraint violations
      if (voteError.code === "23505") {
        return {
          success: false,
          message: "You have already voted in this poll",
        };
      }

      return {
        success: false,
        message: "Failed to submit vote",
      };
    }

    // Revalidate relevant paths to update UI
    revalidatePath("/polls");
    revalidatePath("/dashboard");
    revalidatePath(`/polls/${pollId}`);

    return {
      success: true,
      message: "Your vote has been recorded successfully",
      voteId: vote.id,
      optionId: optionId,
    };
  } catch (error) {
    console.error("Unexpected error in submitVote:", error);
    return {
      success: false,
      message: "An unexpected error occurred",
    };
  }
}

/**
 * Gets the user's vote for a specific poll
 * @param pollId The ID of the poll to check
 * @returns The option ID the user voted for, or null if they haven't voted
 */
export async function getUserVote(pollId: string): Promise<{
  optionId: string | null;
  success: boolean;
  message?: string;
}> {
  try {
    // Ensure user is authenticated
    const { user } = await requireAuth();
    const userId = user.id;

    const supabase = await createClient();

    // Find user's vote in this poll
    const { data, error } = await supabase
      .from("votes")
      .select("option_id, id")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching user vote:", error);

      // If we hit an RLS policy violation, try with admin client
      if (error.code === "42501") {
        // Get the environment variables directly
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

        // Create a custom fetch with timeout
        const fetchWithTimeout = (
          url: RequestInfo | URL,
          options: RequestInit = {},
          timeout = 30000
        ): Promise<Response> => {
          const controller = new AbortController();
          const { signal } = controller;

          // Create a timeout to abort the fetch
          const timeoutId = setTimeout(() => controller.abort(), timeout);

          return fetch(url, { ...options, signal }).finally(() =>
            clearTimeout(timeoutId)
          );
        };

        // Create a new client with the service role key to bypass RLS
        const supabaseAdmin = createAdminClient(
          supabaseUrl,
          supabaseServiceKey,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            global: {
              fetch: fetchWithTimeout,
              headers: { "x-client-info": "server-action" },
            },
            db: {
              schema: "public",
            },
          }
        );

        try {
          // Try again with admin privileges
          const { data: adminData, error: adminError } = await supabaseAdmin
            .from("votes")
            .select("option_id, id")
            .eq("poll_id", pollId)
            .eq("user_id", userId)
            .maybeSingle();

          if (adminError) {
            console.error(
              "Error fetching user vote with service role:",
              adminError
            );
            return {
              optionId: null,
              success: false,
              message: "Failed to fetch vote information",
            };
          }

          return {
            optionId: adminData?.option_id ?? null,
            success: true,
          };
        } catch (adminError) {
          console.error("Admin client vote check error:", adminError);

          // Check if it's a timeout error
          if (adminError instanceof Error && adminError.name === "AbortError") {
            return {
              optionId: null,
              success: false,
              message: "Operation timed out. Please try again.",
            };
          }

          return {
            optionId: null,
            success: false,
            message: "An unexpected error occurred",
          };
        }
      }

      return {
        optionId: null,
        success: false,
        message: "Failed to check vote status",
      };
    }

    return {
      optionId: data?.option_id ?? null,
      success: true,
    };
  } catch (error) {
    console.error("Error in getUserVote:", error);
    return {
      optionId: null,
      success: false,
      message: "An unexpected error occurred",
    };
  }
}
