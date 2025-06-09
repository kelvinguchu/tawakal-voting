import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { PollDetail } from "@/components/polls/poll-detail";
import { titleToSlug, slugToSearchPattern } from "@/lib/utils/slug";

interface VotingPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: VotingPageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  try {
    // Try to find the poll by matching the slug to the title
    const searchPattern = slugToSearchPattern(slug);
    const { data: poll } = await supabase
      .from("polls")
      .select("title, description")
      .ilike("title", `%${searchPattern}%`)
      .single();

    if (poll) {
      return {
        title: `${poll.title} - Tawakal Voting`,
        description: poll.description || `Vote on: ${poll.title}`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }

  return {
    title: "Poll - Tawakal Voting",
    description: "Participate in this poll",
  };
}

export default async function VotingPage({ params }: VotingPageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Check authentication
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    redirect("/login");
  }

  // Update poll statuses first
  try {
    await supabase.rpc("process_poll_status_updates");
  } catch (error) {
    console.error("Error updating poll statuses:", error);
  }

  // Try to find the poll by converting slug back to title search
  const searchPattern = slugToSearchPattern(slug);

  // Try multiple search strategies to find the poll
  let poll = null;
  let pollError = null;

  // Strategy 1: Search by title containing the slug words
  try {
    const { data, error } = await supabase
      .from("polls")
      .select("*")
      .ilike("title", `%${searchPattern}%`)
      .single();

    if (data && !error) {
      // Verify this is the right poll by checking if the generated slug matches
      const generatedSlug = titleToSlug(data.title);
      if (generatedSlug === slug) {
        poll = data;
      }
    }
  } catch (error) {
    console.error("Poll search strategy 1 failed:", error);
  }

  // Strategy 2: If not found, get all polls and find the one with matching slug
  if (!poll) {
    try {
      const { data: allPolls, error } = await supabase
        .from("polls")
        .select("*");

      if (allPolls && !error) {
        poll = allPolls.find((p) => titleToSlug(p.title) === slug);
      }
    } catch (error) {
      console.error("Poll search strategy 2 failed:", error);
      pollError = error;
    }
  }

  // If still no poll found, return 404
  if (!poll) {
    notFound();
  }

  // Check if user exists in users table
  const { data: userDbData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (userError || !userDbData) {
    redirect("/login");
  }

  return (
    <div className='w-full'>
      <PollDetail pollId={poll.id} userId={userData.user.id} />
    </div>
  );
}

// Generate static params for popular/known polls (optional)
// Note: generateStaticParams runs at build time, so we return an empty array
// to allow all polls to be generated on-demand at runtime
export async function generateStaticParams() {
  // Return empty array to enable on-demand static generation for all poll slugs
  // This avoids the cookies context error since generateStaticParams runs at build time
  return [];
}

// Allow dynamic params for polls not pre-generated
export const dynamicParams = true;
