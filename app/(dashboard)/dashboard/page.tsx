import { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { DashboardMetrics } from "@/components/dashboard/dashboard-metrics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Calendar, Clock, TimerOff } from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard - Tawakal Voting System",
  description: "Dashboard for Tawakal's internal voting system",
};

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

  // Fetch user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch active polls
  const { data: activePolls } = await supabase
    .from("polls")
    .select("*, poll_options(*)")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(10);

  // Fetch upcoming polls
  const { data: upcomingPolls } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "scheduled")
    .order("start_time", { ascending: true })
    .limit(10);

  // Fetch recently closed polls
  const { data: recentlyClosedPolls } = await supabase
    .from("polls")
    .select("*")
    .eq("status", "closed")
    .order("end_time", { ascending: false })
    .limit(10);

  // Fetch user's vote count
  const voteCountResult = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const voteCount: number = voteCountResult.count || 0;

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

  return (
    <div className='w-full max-w-full'>
      {/* Dashboard Header */}
      <DashboardHeader userData={userData} />

      {/* Metrics Row */}
      <DashboardMetrics
        voteCount={voteCount}
        activePollsCount={activePolls?.length || 0}
        upcomingPollsCount={upcomingPolls?.length || 0}
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
            {activePolls && activePolls.length > 0 ? (
              <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                {activePolls.map((poll) => (
                  <Card
                    key={poll.id}
                    className='h-full flex flex-col hover:shadow-sm transition-shadow'>
                    <CardHeader className='pb-2 border-b'>
                      <CardTitle className='text-base font-medium text-tawakal-blue line-clamp-1'>
                        {poll.title}
                      </CardTitle>
                      <p className='text-xs text-muted-foreground flex items-center'>
                        <Clock className='h-3 w-3 mr-1 inline text-tawakal-blue' />
                        Ends: {formatDate(poll.end_time, true)}
                      </p>
                    </CardHeader>
                    <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
                      <p className='text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                        {poll.description || "No description provided."}
                      </p>
                      <Button
                        asChild
                        className='w-full mt-auto bg-tawakal-blue hover:bg-tawakal-blue/90'>
                        <Link href={`/polls/${poll.id}`}>Vote Now</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 border rounded-lg'>
                <p className='text-muted-foreground'>
                  No active polls available at this time.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Upcoming Polls Content */}
          <TabsContent value='upcoming' className='mt-0 w-full'>
            {upcomingPolls && upcomingPolls.length > 0 ? (
              <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                {upcomingPolls.map((poll) => (
                  <Card
                    key={poll.id}
                    className='h-full flex flex-col hover:shadow-sm transition-shadow'>
                    <CardHeader className='pb-2 border-b'>
                      <CardTitle className='text-base font-medium text-tawakal-green line-clamp-1'>
                        {poll.title}
                      </CardTitle>
                      <p className='text-xs text-muted-foreground flex items-center'>
                        <Calendar className='h-3 w-3 mr-1 inline text-tawakal-green' />
                        Starts: {formatDate(poll.start_time, true)}
                      </p>
                    </CardHeader>
                    <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
                      <p className='text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                        {poll.description || "No description provided."}
                      </p>
                      <div className='py-1 px-3 text-xs rounded-full bg-tawakal-green/10 text-tawakal-green border border-tawakal-green/20 w-fit'>
                        Scheduled
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 border rounded-lg'>
                <p className='text-muted-foreground'>
                  No upcoming polls available at this time.
                </p>
              </div>
            )}
          </TabsContent>

          {/* Closed Polls Content */}
          <TabsContent value='closed' className='mt-0 w-full'>
            {recentlyClosedPolls && recentlyClosedPolls.length > 0 ? (
              <div className='grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'>
                {recentlyClosedPolls.map((poll) => (
                  <Card
                    key={poll.id}
                    className='h-full flex flex-col hover:shadow-sm transition-shadow'>
                    <CardHeader className='pb-2 border-b'>
                      <CardTitle className='text-base font-medium text-tawakal-gold line-clamp-1'>
                        {poll.title}
                      </CardTitle>
                      <p className='text-xs text-muted-foreground flex items-center'>
                        <TimerOff className='h-3 w-3 mr-1 inline text-tawakal-gold' />
                        Closed: {formatDate(poll.end_time)}
                      </p>
                    </CardHeader>
                    <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
                      <p className='text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                        {poll.description || "No description provided."}
                      </p>
                      <Button
                        asChild
                        variant='outline'
                        className='w-full mt-auto border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'>
                        <Link href={`/polls/${poll.id}`}>View Results</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className='text-center py-8 border rounded-lg'>
                <p className='text-muted-foreground'>
                  No closed polls available at this time.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
