export type User = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: "admin" | "user";
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type PollStatus = "draft" | "scheduled" | "active" | "closed";

export type Poll = {
  id: string;
  title: string;
  description: string | null;
  created_by: string | null;
  status: PollStatus;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
  updated_at: string;
};

export type PollOption = {
  id: string;
  poll_id: string;
  option_text: string;
  created_at: string;
};

export type PollMedia = {
  id: string;
  poll_id: string;
  media_type: "image" | "document" | "link";
  storage_path: string | null;
  media_url: string | null;
  description: string | null;
  created_at: string;
};

export type Vote = {
  id: string;
  poll_id: string;
  option_id: string;
  user_id: string;
  voted_at: string;
};

export type NotificationPreference = {
  user_id: string;
  new_poll_notification: boolean;
  reminder_notification: boolean;
  results_notification: boolean;
  reminder_hours: number;
  created_at: string;
  updated_at: string;
};
