export type UserRole = "admin" | "user";

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type PollStatus = "draft" | "scheduled" | "active" | "closed";

export interface Poll {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  status: PollStatus;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
  poll_options?: PollOption[];
  creator?: User;
}

export interface PollOption {
  id: string;
  poll_id: string;
  option_text: string;
  created_at: string;
}

export type MediaType = "image" | "document" | "link";

export interface PollMedia {
  id: string;
  poll_id: string;
  media_type: MediaType;
  storage_path: string | null;
  media_url: string | null;
  description: string | null;
  created_at: string;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  voted_at: string;
}

export interface NotificationPreference {
  user_id: string;
  new_poll_notification: boolean;
  reminder_notification: boolean;
  results_notification: boolean;
  reminder_hours: number;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  details: Record<string, any> | null;
  ip_address: string | null;
  created_at: string;
}

export interface PollResult {
  poll_id: string;
  poll_title: string;
  status: PollStatus;
  option_id: string;
  option_text: string;
  vote_count: number;
}

export interface UserParticipation {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  polls_voted: number;
  total_eligible_polls: number;
  participation_percent: number;
}
