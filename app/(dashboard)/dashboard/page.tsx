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
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

export default async function DashboardPage() {
  // Create the Supabase client
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    redirect("/login");
  }

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  // Fetch active polls
  const { data: activePolls, error: pollsError } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(5);

  // Fetch user's vote count
  const { count: voteCount, error: voteCountError } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id);

  return (
    <div className='space-y-6'>
      <div className='flex flex-col md:flex-row justify-between gap-4 mb-8'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Welcome back, {userData?.first_name}!
          </h1>
          <p className='text-muted-foreground'>
            Here's what's happening with your voting activity.
          </p>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle>Active Polls</CardTitle>
            <CardDescription>Currently available for voting</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{activePolls?.length || 0}</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/polls'>View all polls</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle>Your Votes</CardTitle>
            <CardDescription>Total votes you've cast</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold'>{voteCount || 0}</div>
          </CardContent>
          <CardFooter>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/history'>View voting history</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className='pb-2'>
            <CardTitle>User Role</CardTitle>
            <CardDescription>Your account type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold capitalize'>
              {userData?.role || "User"}
            </div>
          </CardContent>
          <CardFooter>
            <Button asChild variant='outline' className='w-full'>
              <Link href='/profile'>View profile</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <h2 className='text-2xl font-bold mt-8'>Latest Active Polls</h2>
      {activePolls && activePolls.length > 0 ? (
        <div className='grid gap-4 md:grid-cols-2'>
          {activePolls.map((poll: Poll) => (
            <Card key={poll.id}>
              <CardHeader>
                <CardTitle>{poll.title}</CardTitle>
                <CardDescription>
                  {poll.end_time &&
                    new Date(poll.end_time).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-2'>
                  {poll.description}
                </p>
                <p className='text-sm'>
                  <span className='font-medium'>
                    {poll.poll_options?.length || 0}
                  </span>{" "}
                  voting options
                </p>
              </CardContent>
              <CardFooter>
                <Button asChild className='w-full'>
                  <Link href={`/polls/${poll.id}`}>Vote Now</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='pt-6'>
            <div className='text-center py-6'>
              <p className='text-muted-foreground mb-4'>
                No active polls available right now.
              </p>
              {userData?.role === "admin" && (
                <Button asChild>
                  <Link href='/admin/polls/new'>Create New Poll</Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
