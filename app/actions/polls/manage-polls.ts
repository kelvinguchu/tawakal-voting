"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "../auth/check-user-role";

type PollManagementResult = {
  success: boolean;
  message: string;
  pollId?: string;
};

/**
 * Changes a poll's status manually
 * @param pollId The ID of the poll to update
 * @param newStatus The new status to set
 * @returns Result object with success status and message
 */
export async function changePollStatus(
  pollId: string,
  newStatus: "draft" | "scheduled" | "active" | "closed"
): Promise<PollManagementResult> {
  try {

    const supabase = await createClient();

    // Check if poll exists
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("status, start_time, end_time")
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll:", pollError);
      return {
        success: false,
        message: "Poll not found",
      };
    }

    // Perform validations based on new status
    if (newStatus === "active") {
      // If activating, ensure poll has options
      const { count: optionsCount, error: optionsError } = await supabase
        .from("poll_options")
        .select("*", { count: "exact", head: true })
        .eq("poll_id", pollId);

        if (optionsError) {
          console.error("Error checking options:", optionsError);
          return {
            success: false,
            message: "Failed to verify poll options",
          };
        }

      if (!optionsCount || optionsCount < 2) {
        return {
          success: false,
          message: "Poll must have at least 2 options to be activated",
        };
      }
    }

    // Update the poll status
    const { error: updateError } = await supabase
      .from("polls")
      .update({ status: newStatus })
      .eq("id", pollId);

    if (updateError) {
      console.error("Error updating poll status:", updateError);
      return {
        success: false,
        message: `Failed to update poll status: ${updateError.message}`,
      };
    }

    // Revalidate paths
    revalidatePath("/polls");
    revalidatePath("/dashboard");
    revalidatePath(`/polls/${pollId}`);
    revalidatePath("/admin");

    return {
      success: true,
      message: `Poll status updated to ${newStatus}`,
      pollId,
    };
  } catch (error) {
    console.error("Error in changePollStatus:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Deletes a poll and all its associated data
 * @param pollId The ID of the poll to delete
 * @returns Result object with success status and message
 */
export async function deletePoll(
  pollId: string
): Promise<PollManagementResult> {
  try {
    // Verify admin permissions
    const { userData } = await requireAdmin();

    const supabase = await createClient();

    // Check if poll exists
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("title")
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll:", pollError);
      return {
        success: false,
        message: "Poll not found",
      };
    }

    // Delete the poll (cascade delete will handle options and votes)
    const { error: deleteError } = await supabase
      .from("polls")
      .delete()
      .eq("id", pollId);

    if (deleteError) {
      console.error("Error deleting poll:", deleteError);
      return {
        success: false,
        message: `Failed to delete poll: ${deleteError.message}`,
      };
    }

    // Log the deletion in audit_logs table
    await supabase.from("audit_logs").insert({
      action: "poll_deleted",
      entity_type: "poll",
      entity_id: pollId,
      user_id: userData.id,
      details: { poll_title: poll.title },
    });

    // Revalidate paths
    revalidatePath("/polls");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "Poll deleted successfully",
      pollId,
    };
  } catch (error) {
    console.error("Error in deletePoll:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Processes all polls to update their statuses based on time
 * This is an admin-only function that can be called on demand
 */
export async function processAllPollStatuses(): Promise<PollManagementResult> {
  try {
    // Verify admin permissions
    await requireAdmin();

    const supabase = await createClient();

    // Execute the RPC function that updates all poll statuses
    const { error } = await supabase.rpc("process_poll_status_updates");

    if (error) {
      console.error("Error processing poll statuses:", error);
      return {
        success: false,
        message: `Failed to process poll statuses: ${error.message}`,
      };
    }

    // Revalidate paths
    revalidatePath("/polls");
    revalidatePath("/dashboard");
    revalidatePath("/admin");

    return {
      success: true,
      message: "All poll statuses processed successfully",
    };
  } catch (error) {
    console.error("Error in processAllPollStatuses:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}
