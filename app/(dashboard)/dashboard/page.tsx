import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, TimerOff } from "lucide-react";
import { Suspense } from "react";
import {
  PollsLoading,
  EmptyPollsState,
} from "@/components/dashboard/poll-loading";
import { generatePollUrl } from "@/lib/utils/slug";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - Tawakal Voting System",
  description: "Dashboard for Tawakal's internal voting system",
};

// Poll list component with data fetching - now with preloaded status updates
async function PollsList({
  type,
  userId,
}: {
  type: "active" | "scheduled" | "closed";
  userId: string;
}) {
  const supabase = await createClient();

  let pollsData;

  try {
    // Status updates should have been done in the parent component already

    if (type === "active") {
      const { data } = await supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(10);

      pollsData = data;
    } else if (type === "scheduled") {
      const { data } = await supabase
        .from("polls")
        .select("*")
        .eq("status", "scheduled")
        .order("start_time", { ascending: true })
        .limit(10);

      pollsData = data;
    } else {
      const { data } = await supabase
        .from("polls")
        .select("*")
        .eq("status", "closed")
        .order("end_time", { ascending: false })
        .limit(10);

      pollsData = data;
    }
  } catch (error) {
    console.error(`Error fetching ${type} polls:`, error);
    pollsData = [];
  }

  // Format date helper function
  const formatDate = (dateString: string | null, includeTime = false) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
    });
  };

  if (!pollsData || pollsData.length === 0) {
    return <EmptyPollsState type={type} />;
  }

  const getCardStyle = () => {
    switch (type) {
      case "active":
        return {
          titleColor: "text-tawakal-blue",
          iconColor: "text-tawakal-blue",
          buttonClass: "bg-tawakal-blue hover:bg-tawakal-blue/90",
          icon: <Clock className='h-3 w-3 mr-1 inline text-tawakal-blue' />,
          label: "Ends",
          buttonText: "Vote Now",
        };
      case "scheduled":
        return {
          titleColor: "text-tawakal-green",
          iconColor: "text-tawakal-green",
          buttonClass: "",
          icon: <Calendar className='h-3 w-3 mr-1 inline text-tawakal-green' />,
          label: "Starts",
          buttonText: "",
        };
      case "closed":
        return {
          titleColor: "text-tawakal-gold",
          iconColor: "text-tawakal-gold",
          buttonClass:
            "border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10",
          icon: <TimerOff className='h-3 w-3 mr-1 inline text-tawakal-gold' />,
          label: "Closed",
          buttonText: "View Results",
        };
    }
  };

  const style = getCardStyle();

  return (
    <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
      {pollsData.map((poll) => (
        <Card
          key={poll.id}
          className='h-full flex flex-col hover:shadow-sm transition-shadow'>
          <CardHeader className='pb-2 border-b'>
            <CardTitle
              className={`text-base font-medium ${style.titleColor} line-clamp-1`}>
              {poll.title}
            </CardTitle>
            <p className='text-xs text-muted-foreground flex items-center'>
              {style.icon}
              {style.label}:{" "}
              {formatDate(
                type === "scheduled" ? poll.start_time : poll.end_time,
                true
              )}
            </p>
          </CardHeader>
          <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
            <p className='text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
              {poll.description || "No description provided."}
            </p>
            {type === "scheduled" ? (
              <div className='py-1 px-3 text-xs rounded-full bg-tawakal-green/10 text-tawakal-green border border-tawakal-green/20 w-fit'>
                Scheduled
              </div>
            ) : (
              // Use Link navigation for both active and closed polls
              <Link href={generatePollUrl(poll.title)}>
                <Button
                  variant={type === "closed" ? "outline" : "default"}
                  className={`w-full mt-auto ${style.buttonClass}`}>
                  {style.buttonText}
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Preloader component that ensures poll statuses are updated before showing any content
async function PollStatusPreloader() {
  const supabase = await createClient();

  // Update all poll statuses
  try {
    await supabase.rpc("process_poll_status_updates");
  } catch (error) {
    console.error("Error updating poll statuses in preloader:", error);
  }

  return null; // This component doesn't render anything
}

export default async function DashboardPage() {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // First, update all poll statuses to ensure accurate counts and categorization
  await supabase.rpc("process_poll_status_updates");

  // Fetch user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch basic metrics without waiting for all poll data
  const voteCountResult = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const voteCount: number = voteCountResult.count || 0;

  // Get just the counts for metrics
  const { count: activePollsCount } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .eq("status", "active");

  const { count: upcomingPollsCount } = await supabase
    .from("polls")
    .select("*", { count: "exact", head: true })
    .eq("status", "scheduled");

  return (
    <div className='w-full max-w-full'>
      {/* Ensure poll statuses are updated before anything renders */}
      <Suspense fallback={null}>
        <PollStatusPreloader />
      </Suspense>

      {/* Dashboard Header */}
      <DashboardHeader userData={userData} />

      {/* Metrics Row */}
      <DashboardMetrics
        voteCount={voteCount}
        activePollsCount={activePollsCount || 0}
        upcomingPollsCount={upcomingPollsCount || 0}
        isAdmin={userData?.role === "admin"}
      />

      {/* Main Content - Tabbed Interface */}
      <div className='mt-6'>
        <div className='mb-4'>
          <h2 className='text-xl font-semibold text-tawakal-blue'>
            Polls Overview
          </h2>
        </div>

        <Tabs defaultValue='active' className='w-full'>
          <TabsList className='bg-muted/30 p-0.5 flex space-x-1 rounded-md w-auto mb-8'>
            <TabsTrigger
              value='active'
              className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
              <Clock className='h-4 w-4 mr-1.5' />
              Active
            </TabsTrigger>
            <TabsTrigger
              value='upcoming'
              className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-green data-[state=active]:text-white'>
              <Calendar className='h-4 w-4 mr-1.5' />
              Upcoming
            </TabsTrigger>
            <TabsTrigger
              value='closed'
              className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-gold data-[state=active]:text-white'>
              <TimerOff className='h-4 w-4 mr-1.5' />
              Closed
            </TabsTrigger>
          </TabsList>

          {/* Active Polls Content */}
          <TabsContent value='active' className='mt-0 w-full'>
            <Suspense fallback={<PollsLoading />}>
              <PollsList type='active' userId={user.id} />
            </Suspense>
          </TabsContent>

          {/* Upcoming Polls Content */}
          <TabsContent value='upcoming' className='mt-0 w-full'>
            <Suspense fallback={<PollsLoading />}>
              <PollsList type='scheduled' userId={user.id} />
            </Suspense>
          </TabsContent>

          {/* Closed Polls Content */}
          <TabsContent value='closed' className='mt-0 w-full'>
            <Suspense fallback={<PollsLoading />}>
              <PollsList type='closed' userId={user.id} />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
