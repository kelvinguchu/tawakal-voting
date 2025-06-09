"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Clock, TimerOff, Search, Filter } from "lucide-react";
import { Poll } from "@/lib/types/database";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { motion } from "framer-motion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { generatePollUrl } from "@/lib/utils/slug";

// Format date helper function
const formatDate = (dateString: string | null, includeTime = true) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(includeTime && { hour: "2-digit", minute: "2-digit" }),
  });
};

// Variants for animation
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.4,
    },
  },
};

export function PollsList() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const supabase = createClient();

  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(
    searchParams.get("status") || "active"
  );
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const getUserId = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUserId(data.user.id);
      }
    };

    getUserId();
    fetchPolls(activeTab as "active" | "scheduled" | "closed");
  }, [activeTab]);

  const fetchPolls = async (status: "active" | "scheduled" | "closed") => {
    setLoading(true);
    try {
      let query = supabase
        .from("polls")
        .select("*, poll_options(*)")
        .eq("status", status)
        .order(
          status === "scheduled" ? "start_time" : "end_time",
          status === "scheduled" ? { ascending: true } : { ascending: false }
        );

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching polls:", error);
        return;
      }

      setPolls(data || []);
    } catch (error) {
      console.error("Error fetching polls:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    // Update the URL without full page reload
    router.push(`/polls?status=${value}`, { scroll: false });
  };

  const filteredPolls = polls.filter((poll) =>
    poll.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getPollStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Clock className='h-5 w-5 text-tawakal-green' />;
      case "scheduled":
        return <Calendar className='h-5 w-5 text-tawakal-blue' />;
      case "closed":
        return <TimerOff className='h-5 w-5 text-tawakal-gold' />;
      default:
        return null;
    }
  };

  const getPollStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-tawakal-green";
      case "scheduled":
        return "text-tawakal-blue";
      case "closed":
        return "text-tawakal-gold";
      default:
        return "text-gray-500";
    }
  };

  const getPollStatusBg = (status: string) => {
    switch (status) {
      case "active":
        return "bg-tawakal-green/10";
      case "scheduled":
        return "bg-tawakal-blue/10";
      case "closed":
        return "bg-tawakal-gold/10";
      default:
        return "bg-gray-100";
    }
  };

  return (
    <div className='space-y-6 sm:space-y-8'>
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        <div className='text-center sm:text-left'>
          <h1 className='text-xl sm:text-2xl font-bold'>Polls</h1>
          <p className='text-sm sm:text-base text-muted-foreground'>
            View and participate in polls
          </p>
        </div>

        <div className='w-full sm:w-auto relative'>
          <Search className='absolute left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
          <Input
            placeholder='Search polls...'
            className='pl-8 sm:pl-9 w-full sm:w-[300px] h-9 sm:h-10 text-sm sm:text-base'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className='w-full'>
        <TabsList className='bg-muted/30 p-0.5 flex space-x-1 rounded-md w-full sm:w-auto mb-6 sm:mb-8 justify-center'>
          <TabsTrigger
            value='active'
            className='flex items-center text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-tawakal-green data-[state=active]:text-white flex-1 sm:flex-initial'>
            <Clock className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5' />
            <span className='hidden sm:inline'>Active</span>
            <span className='sm:hidden'>Active</span>
          </TabsTrigger>
          <TabsTrigger
            value='scheduled'
            className='flex items-center text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-tawakal-blue data-[state=active]:text-white flex-1 sm:flex-initial'>
            <Calendar className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5' />
            <span className='hidden sm:inline'>Upcoming</span>
            <span className='sm:hidden'>Coming</span>
          </TabsTrigger>
          <TabsTrigger
            value='closed'
            className='flex items-center text-xs sm:text-sm px-2 sm:px-4 py-2 rounded-md data-[state=active]:bg-tawakal-gold data-[state=active]:text-white flex-1 sm:flex-initial'>
            <TimerOff className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-1.5' />
            <span className='hidden sm:inline'>Closed</span>
            <span className='sm:hidden'>Closed</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab content */}
        <TabsContent value='active' className='mt-0 w-full'>
          {loading ? (
            <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <PollCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPolls.length > 0 ? (
            <motion.div
              className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              variants={containerVariants}
              initial='hidden'
              animate='visible'>
              {filteredPolls.map((poll) => (
                <motion.div key={poll.id} variants={itemVariants}>
                  <Link href={generatePollUrl(poll.title)}>
                    <Card className='h-full flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2 sm:border'>
                      <CardHeader className='pb-2 border-b px-3 sm:px-6 pt-3 sm:pt-6'>
                        <CardTitle className='text-sm sm:text-base font-medium text-tawakal-green line-clamp-2'>
                          {poll.title}
                        </CardTitle>
                        <p className='text-xs text-muted-foreground flex items-center'>
                          <Clock className='h-3 w-3 mr-1 inline text-tawakal-green' />
                          Ends: {formatDate(poll.end_time, true)}
                        </p>
                      </CardHeader>
                      <CardContent className='pt-3 sm:pt-4 pb-3 flex-grow flex flex-col px-3 sm:px-6'>
                        <p className='text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                          {poll.description || "No description provided."}
                        </p>
                        <Button className='w-full mt-auto bg-tawakal-green hover:bg-tawakal-green/90 h-9 sm:h-10 text-sm sm:text-base'>
                          <span className='hidden sm:inline'>Vote Now</span>
                          <span className='sm:hidden'>Vote</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className='text-center py-6 sm:py-8 border rounded-lg mx-4 sm:mx-0'>
              <p className='text-sm sm:text-base text-muted-foreground'>
                No active polls available at this time.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value='scheduled' className='mt-0 w-full'>
          {loading ? (
            <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <PollCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPolls.length > 0 ? (
            <motion.div
              className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              variants={containerVariants}
              initial='hidden'
              animate='visible'>
              {filteredPolls.map((poll) => (
                <motion.div key={poll.id} variants={itemVariants}>
                  <Link href={generatePollUrl(poll.title)}>
                    <Card className='h-full flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2 sm:border'>
                      <CardHeader className='pb-2 border-b px-3 sm:px-6 pt-3 sm:pt-6'>
                        <CardTitle className='text-sm sm:text-base font-medium text-tawakal-blue line-clamp-2'>
                          {poll.title}
                        </CardTitle>
                        <p className='text-xs text-muted-foreground flex items-center'>
                          <Calendar className='h-3 w-3 mr-1 inline text-tawakal-blue' />
                          Starts: {formatDate(poll.start_time, true)}
                        </p>
                      </CardHeader>
                      <CardContent className='pt-3 sm:pt-4 pb-3 flex-grow flex flex-col px-3 sm:px-6'>
                        <p className='text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                          {poll.description || "No description provided."}
                        </p>
                        <div className='py-1 px-2 sm:px-3 text-xs rounded-full bg-tawakal-blue/10 text-tawakal-blue border border-tawakal-blue/20 w-fit'>
                          <span className='hidden sm:inline'>Scheduled</span>
                          <span className='sm:hidden'>Coming</span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className='text-center py-6 sm:py-8 border rounded-lg mx-4 sm:mx-0'>
              <p className='text-sm sm:text-base text-muted-foreground'>
                No upcoming polls available at this time.
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value='closed' className='mt-0 w-full'>
          {loading ? (
            <div className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'>
              {[1, 2, 3, 4].map((i) => (
                <PollCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredPolls.length > 0 ? (
            <motion.div
              className='grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
              variants={containerVariants}
              initial='hidden'
              animate='visible'>
              {filteredPolls.map((poll) => (
                <motion.div key={poll.id} variants={itemVariants}>
                  <Link href={generatePollUrl(poll.title)}>
                    <Card className='h-full flex flex-col hover:shadow-md transition-all duration-200 cursor-pointer hover:scale-[1.02] border-2 sm:border'>
                      <CardHeader className='pb-2 border-b px-3 sm:px-6 pt-3 sm:pt-6'>
                        <CardTitle className='text-sm sm:text-base font-medium text-tawakal-gold line-clamp-2'>
                          {poll.title}
                        </CardTitle>
                        <p className='text-xs text-muted-foreground flex items-center'>
                          <TimerOff className='h-3 w-3 mr-1 inline text-tawakal-gold' />
                          Closed: {formatDate(poll.end_time, true)}
                        </p>
                      </CardHeader>
                      <CardContent className='pt-3 sm:pt-4 pb-3 flex-grow flex flex-col px-3 sm:px-6'>
                        <p className='text-xs sm:text-sm text-muted-foreground mb-3 line-clamp-2 flex-grow'>
                          {poll.description || "No description provided."}
                        </p>
                        <Button
                          variant='outline'
                          className='w-full mt-auto border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10 h-9 sm:h-10 text-sm sm:text-base'>
                          <span className='hidden sm:inline'>View Results</span>
                          <span className='sm:hidden'>Results</span>
                        </Button>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className='text-center py-6 sm:py-8 border rounded-lg mx-4 sm:mx-0'>
              <p className='text-sm sm:text-base text-muted-foreground'>
                No closed polls available at this time.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PollCardSkeleton() {
  return (
    <Card className='h-full flex flex-col'>
      <CardHeader className='pb-2 border-b'>
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-3 w-1/2 mt-2' />
      </CardHeader>
      <CardContent className='pt-4 pb-3 flex-grow flex flex-col'>
        <Skeleton className='h-4 w-full mt-1' />
        <Skeleton className='h-4 w-5/6 mt-1' />
        <Skeleton className='h-4 w-4/6 mt-1' />
        <Skeleton className='h-9 w-full mt-auto' />
      </CardContent>
    </Card>
  );
}
