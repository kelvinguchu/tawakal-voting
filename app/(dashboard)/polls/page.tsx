import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PollsList } from "@/components/polls/poll-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Polls - Tawakal Voting System",
  description: "Browse and vote on active polls",
};

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
      <PollsList />
    </div>
  );
}
