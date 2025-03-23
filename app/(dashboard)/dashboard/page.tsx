import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { Poll } from "@/lib/types/database";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
  ActivePollsCard,
  UpcomingPollsCard,
  ClosedPollsCard,
} from "@/components/dashboard/poll-cards";
import { HelpCard } from "@/components/dashboard/help-card";

export const metadata: Metadata = {
  title: "Dashboard - Internal Voting System",
  description: "Dashboard for the internal voting system",
};

async function getActivePolls() {
  const supabase = await createClient();
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching active polls:", error);
    return [];
  }

  return polls as Poll[];
}

async function getUpcomingPolls() {
  const supabase = await createClient();
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "scheduled")
    .order("start_time", { ascending: true })
    .limit(5);

  if (error) {
    console.error("Error fetching upcoming polls:", error);
    return [];
  }

  return polls as Poll[];
}

async function getRecentlyClosedPolls() {
  const supabase = await createClient();
  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "closed")
    .order("end_time", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching closed polls:", error);
    return [];
  }

  return polls as Poll[];
}

export default async function Dashboard() {
  const [activePolls, upcomingPolls, closedPolls] = await Promise.all([
    getActivePolls(),
    getUpcomingPolls(),
    getRecentlyClosedPolls(),
  ]);

  return (
    <div className='space-y-8'>
      <DashboardHeader />

      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        <ActivePollsCard polls={activePolls} />
        <UpcomingPollsCard polls={upcomingPolls} />
        <ClosedPollsCard polls={closedPolls} />
      </div>

      <HelpCard />
    </div>
  );
}
