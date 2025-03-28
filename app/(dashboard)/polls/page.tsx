import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PollsList } from "@/components/polls/poll-list";
import { Metadata } from "next";
import { Suspense } from "react";
import { PollsLoading } from "@/components/dashboard/poll-loading";

export const metadata: Metadata = {
  title: "Polls - Tawakal Voting System",
  description: "Browse and vote on active polls",
};

// Status updater component
async function PollStatusUpdater() {
  const supabase = await createClient();

  try {
    await supabase.rpc("process_poll_status_updates");
  } catch (error) {
    console.error("Error updating poll statuses:", error);
  }

  return null;
}

export default async function PollsPage() {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Process poll status updates before rendering
  await supabase.rpc("process_poll_status_updates");

  // Fetch user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData) {
    redirect("/login");
  }

  return (
    <div className='w-full max-w-full'>
      {/* Ensure poll statuses are updated before anything renders */}
      <Suspense fallback={null}>
        <PollStatusUpdater />
      </Suspense>

      <Suspense fallback={<PollsLoading />}>
        <PollsList />
      </Suspense>
    </div>
  );
}
