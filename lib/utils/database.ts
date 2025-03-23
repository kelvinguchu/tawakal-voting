import { SupabaseClient } from "@supabase/supabase-js";
import {
  User,
  Poll,
  PollOption,
  PollMedia,
  Vote,
  NotificationPreference,
  PollStatus,
} from "../types/database";

// User related queries
export const getUserById = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as User;
};

export const getUsers = async (
  supabase: SupabaseClient,
  isActive: boolean | null = null
) => {
  let query = supabase.from("users").select("*");

  if (isActive !== null) {
    query = query.eq("is_active", isActive);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as User[];
};

export const createUser = async (
  supabase: SupabaseClient,
  userData: Omit<User, "id" | "created_at" | "updated_at">
) => {
  const { data, error } = await supabase
    .from("users")
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

export const updateUser = async (
  supabase: SupabaseClient,
  id: string,
  userData: Partial<Omit<User, "id" | "created_at" | "updated_at">>
) => {
  const { data, error } = await supabase
    .from("users")
    .update(userData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as User;
};

// Poll related queries
export const getPollById = async (supabase: SupabaseClient, id: string) => {
  const { data, error } = await supabase
    .from("polls")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as Poll;
};

export const getPolls = async (
  supabase: SupabaseClient,
  status?: PollStatus[]
) => {
  let query = supabase.from("polls").select("*");

  if (status && status.length > 0) {
    query = query.in("status", status);
  }

  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) throw error;
  return data as Poll[];
};

export const createPoll = async (
  supabase: SupabaseClient,
  pollData: Omit<Poll, "id" | "created_at" | "updated_at">
) => {
  const { data, error } = await supabase
    .from("polls")
    .insert(pollData)
    .select()
    .single();

  if (error) throw error;
  return data as Poll;
};

export const updatePoll = async (
  supabase: SupabaseClient,
  id: string,
  pollData: Partial<Omit<Poll, "id" | "created_at" | "updated_at">>
) => {
  const { data, error } = await supabase
    .from("polls")
    .update(pollData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as Poll;
};

// Poll options related queries
export const getPollOptions = async (
  supabase: SupabaseClient,
  pollId: string
) => {
  const { data, error } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId);

  if (error) throw error;
  return data as PollOption[];
};

export const createPollOption = async (
  supabase: SupabaseClient,
  optionData: Omit<PollOption, "id" | "created_at">
) => {
  const { data, error } = await supabase
    .from("poll_options")
    .insert(optionData)
    .select()
    .single();

  if (error) throw error;
  return data as PollOption;
};

export const createPollOptions = async (
  supabase: SupabaseClient,
  options: Omit<PollOption, "id" | "created_at">[]
) => {
  const { data, error } = await supabase
    .from("poll_options")
    .insert(options)
    .select();

  if (error) throw error;
  return data as PollOption[];
};

// Poll media related queries
export const getPollMedia = async (
  supabase: SupabaseClient,
  pollId: string
) => {
  const { data, error } = await supabase
    .from("poll_media")
    .select("*")
    .eq("poll_id", pollId);

  if (error) throw error;
  return data as PollMedia[];
};

export const createPollMedia = async (
  supabase: SupabaseClient,
  mediaData: Omit<PollMedia, "id" | "created_at">
) => {
  const { data, error } = await supabase
    .from("poll_media")
    .insert(mediaData)
    .select()
    .single();

  if (error) throw error;
  return data as PollMedia;
};

// Vote related queries
export const castVote = async (
  supabase: SupabaseClient,
  voteData: Omit<Vote, "id" | "voted_at">
) => {
  const { data, error } = await supabase
    .from("votes")
    .insert(voteData)
    .select()
    .single();

  if (error) throw error;
  return data as Vote;
};

export const hasUserVoted = async (
  supabase: SupabaseClient,
  pollId: string,
  userId: string
) => {
  const { data, error } = await supabase
    .from("votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (error) throw error;
  return data.length > 0;
};

export const getPollResults = async (
  supabase: SupabaseClient,
  pollId: string
) => {
  const { data, error } = await supabase
    .rpc("poll_results", { poll_id: pollId })
    .select("*");

  if (error) throw error;
  return data;
};

// Notification preferences
export const getNotificationPreferences = async (
  supabase: SupabaseClient,
  userId: string
) => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return data as NotificationPreference;
};

export const updateNotificationPreferences = async (
  supabase: SupabaseClient,
  userId: string,
  prefData: Partial<
    Omit<NotificationPreference, "user_id" | "created_at" | "updated_at">
  >
) => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .update(prefData)
    .eq("user_id", userId)
    .select()
    .single();

  if (error) throw error;
  return data as NotificationPreference;
};
