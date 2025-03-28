import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PollDetail } from "@/components/polls/poll-detail";
import { Metadata } from "next";
import { Suspense } from "react";

// Define the correct params type
type Params = { id: string };

// Metadata generator
export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const supabase = await createClient();
  const pollId = params.id;

  try {
    const { data: poll } = await supabase
      .from("polls")
      .select("title")
      .eq("id", pollId)
      .single();

    return {
      title: poll?.title
        ? `${poll.title} - Tawakal Voting System`
        : "Poll Details - Tawakal Voting System",
      description: "View poll details and results",
    };
  } catch (error) {
    return {
      title: "Poll Details - Tawakal Voting System",
      description: "View poll details and results",
    };
  }
}

// Poll status updater component
async function PollStatusPreloader() {
  const supabase = await createClient();

  try {
    await supabase.rpc("process_poll_status_updates");
  } catch (error) {
    console.error("Error updating poll statuses in preloader:", error);
  }

  return null;
}

// Note the different approach to destructuring the props
export default async function PollPage(props: { params: Params }) {
  const supabase = await createClient();

  // No need to await props.params since it's a plain object
  const { id: pollId } = props.params;

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Update poll status before loading content
  try {
    await supabase.rpc("process_poll_status_updates");
  } catch (error) {
    console.error("Error updating poll status:", error);
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
    <div className='min-h-[95vh] w-full max-w-full p-6'>
      {/* Additional status update before render */}
      <Suspense fallback={null}>
        <PollStatusPreloader />
      </Suspense>

      <PollDetail pollId={pollId} userId={user.id} />
    </div>
  );
}
