"use server";

import { createClient } from "@/lib/supabase/server";
import { Poll, PollOption } from "@/lib/types/database";
import { updatePollStatus } from "./update-poll-status";

type PollResults = {
  [key: string]: number; // option_id -> vote count
};

/**
 * Poll status definitions:
 * - draft: A poll that's being created but not yet ready to be shown to users
 * - scheduled: A poll that's complete but intentionally set to start at a future date
 * - active: A poll that's currently accepting votes (may need to check start_time as well)
 * - closed: A poll that has ended and no longer accepts votes
 */
type PollWithOptions = Poll & {
  poll_options: PollOption[];
  results?: PollResults;
  total_votes?: number;
  user_vote?: string | null;
};

type OptionImagesMap = {
  [key: string]: string; // option_id -> image URL
};

/**
 * Fetches a single poll with its options and results
 * @param pollId The ID of the poll to fetch
 * @param userId Optional user ID to check if they've voted
 * @returns The poll with options and results, or null if not found
 */
export async function fetchPollWithOptions(
  pollId: string,
  userId?: string
): Promise<PollWithOptions | null> {
  try {
    const supabase = await createClient();

    // First update the poll status if needed
    await updatePollStatus(pollId);

    // Fetch poll with options
    const { data: poll, error: pollError } = await supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("id", pollId)
      .single();

    if (pollError) {
      console.error("Error fetching poll:", pollError);
      return null;
    }

    // Prepare results object
    const pollWithResults: PollWithOptions = poll;
    pollWithResults.results = {};
    pollWithResults.total_votes = 0;

    // Fetch votes for this poll
    console.log(`Fetching votes for poll: ${pollId} using standard client`);
    const { data: votes, error: votesError } = await supabase
      .from("votes")
      .select("option_id, id, user_id")
      .eq("poll_id", pollId);

    if (votesError) {
      console.error("Error fetching votes:", votesError);
      // Continue anyway with zero votes
    } else if (votes && votes.length > 0) {
      // Count votes for each option
      const results: PollResults = {};

      // Initialize all options with zero votes
      poll.poll_options.forEach((option: PollOption) => {
        results[option.id] = 0;
      });

      console.log(`Poll ${pollId} has ${votes.length} votes:`, votes);

      // Check if userId is in the votes
      if (userId) {
        const userVoted = votes.some((vote) => vote.user_id === userId);
        console.log(`User ${userId} has voted in poll ${pollId}: ${userVoted}`);

        // If user has voted, set it immediately to avoid inconsistency
        if (userVoted) {
          const userVote = votes.find((vote) => vote.user_id === userId);
          if (userVote && userVote.option_id) {
            pollWithResults.user_vote = userVote.option_id;
            console.log(
              `Setting user vote from votes array: ${userVote.option_id}`
            );
          }
        }
      }

      // Count actual votes
      votes.forEach((vote) => {
        if (vote.option_id) {
          if (results[vote.option_id] !== undefined) {
            results[vote.option_id]++;
          } else {
            results[vote.option_id] = 1;
          }
        }
      });

      pollWithResults.results = results;
      pollWithResults.total_votes = votes.length;

      console.log(`Poll ${pollId} vote counts:`, results);
      console.log(`Poll ${pollId} total votes: ${votes.length}`);
    } else {
      console.log(`Poll ${pollId} has no votes yet (or query failed silently)`);

      // Try a direct SQL query as a backup approach
      try {
        const { data: directVotes, error: directError } = await supabase.rpc(
          "get_votes_for_poll",
          { poll_id: pollId }
        );

        if (!directError && directVotes && directVotes.length > 0) {
          console.log(
            `Direct SQL found ${directVotes.length} votes for poll ${pollId}`
          );

          // Update poll with these votes
          const results: PollResults = {};
          poll.poll_options.forEach((option: PollOption) => {
            results[option.id] = 0;
          });

          directVotes.forEach((vote: any) => {
            if (vote.option_id && results[vote.option_id] !== undefined) {
              results[vote.option_id]++;
            }

            // Check if this is the user's vote
            if (userId && vote.user_id === userId) {
              pollWithResults.user_vote = vote.option_id;
              console.log(`Found user vote via direct SQL: ${vote.option_id}`);
            }
          });

          pollWithResults.results = results;
          pollWithResults.total_votes = directVotes.length;
        } else if (directError) {
          console.error("Error in direct vote query:", directError);
        }
      } catch (directQueryError) {
        console.error("Could not execute direct vote query:", directQueryError);
      }
    }

    // If userId is provided, check if they've voted (regardless of earlier results)
    if (userId && !pollWithResults.user_vote) {
      console.log(
        `Double-checking if user ${userId} has voted in poll ${pollId}`
      );
      const { data: userVote, error: userVoteError } = await supabase
        .from("votes")
        .select("option_id, id")
        .eq("poll_id", pollId)
        .eq("user_id", userId)
        .maybeSingle();

      if (userVoteError) {
        console.error(`Error checking if user ${userId} voted:`, userVoteError);

        // Try another approach if we hit an error - try a direct SQL query
        try {
          const { data: directUserVote, error: directVoteError } =
            await supabase.rpc("get_user_vote", {
              p_poll_id: pollId,
              p_user_id: userId,
            });

          if (!directVoteError && directUserVote) {
            console.log(
              `Direct SQL found user vote: ${directUserVote.option_id}`
            );
            pollWithResults.user_vote = directUserVote.option_id;
          } else if (directVoteError) {
            console.error("Error in direct user vote query:", directVoteError);
          }
        } catch (directUserVoteError) {
          console.error(
            "Failed to execute direct user vote query:",
            directUserVoteError
          );
        }
      } else if (userVote) {
        console.log(
          `User ${userId} has voted for option ${userVote.option_id} in poll ${pollId}`
        );
        pollWithResults.user_vote = userVote.option_id;
      } else {
        console.log(
          `User ${userId} has not voted in poll ${pollId} via standard query`
        );

        // As a final check, try a more direct approach
        try {
          const { count, error: countError } = await supabase
            .from("votes")
            .select("*", { count: "exact", head: true })
            .eq("poll_id", pollId)
            .eq("user_id", userId);

          if (!countError && count && count > 0) {
            console.log(
              `Count query found ${count} votes by user ${userId} in poll ${pollId}`
            );

            // Try to get the actual vote
            const { data: lastResortVote } = await supabase
              .from("votes")
              .select("option_id")
              .eq("poll_id", pollId)
              .eq("user_id", userId)
              .single();

            if (lastResortVote) {
              console.log(
                `Last resort found user vote: ${lastResortVote.option_id}`
              );
              pollWithResults.user_vote = lastResortVote.option_id;
            }
          }
        } catch (countError) {
          console.error("Error in count query:", countError);
        }
      }
    }

    return pollWithResults;
  } catch (error) {
    console.error("Error in fetchPollWithOptions:", error);
    return null;
  }
}

/**
 * Fetches all polls of a certain status
 * @param status The status of polls to fetch (active, scheduled, closed)
 * @param limit Optional limit on number of polls to return
 * @returns An array of polls with their options
 */
export async function fetchPollsByStatus(
  status: "active" | "scheduled" | "closed",
  limit?: number
): Promise<PollWithOptions[]> {
  try {
    const supabase = await createClient();

    // First update all poll statuses
    await supabase.rpc("process_poll_status_updates");

    // Build query
    let query = supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("status", status);

    // Add ordering based on status
    if (status === "active" || status === "closed") {
      query = query.order("end_time", { ascending: status === "active" });
    } else {
      query = query.order("start_time", { ascending: true });
    }

    // Add limit if specified
    if (limit && limit > 0) {
      query = query.limit(limit);
    }

    // Execute query
    const { data: polls, error: pollsError } = await query;

    if (pollsError) {
      console.error(`Error fetching ${status} polls:`, pollsError);
      return [];
    }

    return polls || [];
  } catch (error) {
    console.error(`Error in fetchPollsByStatus for ${status}:`, error);
    return [];
  }
}

/**
 * Fetches recent polls for the dashboard
 * Returns a set of active, upcoming, and closed polls
 * @param limit The maximum number of polls to return per category
 * @returns Object containing arrays of polls by status
 */
export async function fetchDashboardPolls(limit: number = 5): Promise<{
  active: PollWithOptions[];
  upcoming: PollWithOptions[];
  closed: PollWithOptions[];
}> {
  try {
    const supabase = await createClient();

    // Update all poll statuses first
    await supabase.rpc("process_poll_status_updates");

    // Fetch active polls
    const { data: activePolls, error: activeError } = await supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("status", "active")
      .order("end_time", { ascending: true })
      .limit(limit);

    // Fetch upcoming polls
    const { data: upcomingPolls, error: upcomingError } = await supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("status", "scheduled")
      .order("start_time", { ascending: true })
      .limit(limit);

    // Fetch closed polls
    const { data: closedPolls, error: closedError } = await supabase
      .from("polls")
      .select("*, poll_options(*)")
      .eq("status", "closed")
      .order("end_time", { ascending: false })
      .limit(limit);

    // Log any errors but continue
    if (activeError) console.error("Error fetching active polls:", activeError);
    if (upcomingError)
      console.error("Error fetching upcoming polls:", upcomingError);
    if (closedError) console.error("Error fetching closed polls:", closedError);

    return {
      active: activePolls || [],
      upcoming: upcomingPolls || [],
      closed: closedPolls || [],
    };
  } catch (error) {
    console.error("Error in fetchDashboardPolls:", error);
    return { active: [], upcoming: [], closed: [] };
  }
}

/**
 * Fetches option images for a poll
 * @param pollId The ID of the poll
 * @returns Map of option IDs to image URLs
 */
export async function fetchPollOptionImages(
  pollId: string
): Promise<OptionImagesMap> {
  try {
    const supabase = await createClient();
    const optionImages: OptionImagesMap = {};

    // First get all options for this poll
    const { data: options, error: optionsError } = await supabase
      .from("poll_options")
      .select("id")
      .eq("poll_id", pollId);

    if (optionsError || !options) {
      console.error("Error fetching poll options:", optionsError);
      return {};
    }

    // For each option, get its image if it exists
    for (const option of options) {
      const { data: mediaData, error: mediaError } = await supabase
        .from("option_media")
        .select("storage_path")
        .eq("option_id", option.id)
        .single();

      if (!mediaError && mediaData) {
        const { data: imageUrl } = await supabase.storage
          .from("vote-media")
          .createSignedUrl(mediaData.storage_path, 60 * 60); // 1 hour expiry

        if (imageUrl) {
          optionImages[option.id] = imageUrl.signedUrl;
        }
      }
    }

    return optionImages;
  } catch (error) {
    console.error("Error in fetchPollOptionImages:", error);
    return {};
  }
}
