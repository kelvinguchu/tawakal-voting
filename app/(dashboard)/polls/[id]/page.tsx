import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PollDetail } from "@/components/polls/poll-detail";
import { Metadata } from "next";
import { Suspense } from "react";

// Define the params type as Promise
type Params = Promise<{ id: string }>;
type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

// Metadata generator using Promise params
export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  // In Next.js 15, we need to await the params
  const { id } = await params;
  const supabase = await createClient();

  try {
    const { data: poll } = await supabase
      .from("polls")
      .select("title")
      .eq("id", id)
      .single();

    return {
      title: poll?.title
        ? `${poll.title} - Tawakal Voting System`
        : "Poll Details - Tawakal Voting System",
      description: "View poll details and results",
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
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

// Using the Next.js 15 pattern with Promise params
export default async function PollPage({
  params,
  searchParams,
}: Readonly<{
  params: Params;
  searchParams: SearchParams;
}>) {
  // Await the params to get the actual values
  const { id: pollId } = await params;
  const supabase = await createClient();

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
