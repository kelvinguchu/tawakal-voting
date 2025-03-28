"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Updates the status of a specific poll based on its start and end times
 * @param pollId The ID of the poll to update
 * @returns The updated poll status or null if failed
 */
export async function updatePollStatus(pollId: string) {
  try {
    const supabase = await createClient();

    // Fetch poll data
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("status, start_time, end_time")
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll data:", pollError);
      return null;
    }

    const now = new Date().toISOString();
    let newStatus = poll.status;

    // Update status based on current time
    if (poll.status === "active" && poll.end_time && now > poll.end_time) {
      newStatus = "closed";
    } else if (
      poll.status === "scheduled" &&
      poll.start_time &&
      now > poll.start_time
    ) {
      newStatus = "active";
    } else {
      // No change needed
      return poll.status;
    }

    // Only update if status has changed
    if (newStatus !== poll.status) {
      const { data, error } = await supabase
        .from("polls")
        .update({ status: newStatus })
        .eq("id", pollId)
        .select("status")
        .single();

      if (error) {
        console.error("Error updating poll status:", error);
        return null;
      }

      // Revalidate relevant paths to update UI
      revalidatePath("/polls");
      revalidatePath("/dashboard");
      revalidatePath(`/polls/${pollId}`);

      return data.status;
    }

    return poll.status;
  } catch (error) {
    console.error("Unexpected error in updatePollStatus:", error);
    return null;
  }
}

/**
 * Updates the status of all polls based on their start and end times
 * @returns True if update was successful, false otherwise
 */
export async function updateAllPollStatuses() {
  try {
    const supabase = await createClient();

    // Call the Supabase RPC function for updating all poll statuses
    await supabase.rpc("process_poll_status_updates");

    // Revalidate relevant paths to update UI
    revalidatePath("/polls");
    revalidatePath("/dashboard");

    return true;
  } catch (error) {
    console.error("Error updating all poll statuses:", error);
    return false;
  }
}
