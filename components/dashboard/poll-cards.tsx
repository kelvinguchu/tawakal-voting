"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Poll } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { CalendarClock, Check, TimerOff } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

// Format date helper function
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const listItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.3,
    },
  }),
};

// Function to check and update poll statuses
const updatePollStatuses = async () => {
  const supabase = createClient();

  // Update active polls that have ended
  await supabase
    .from("polls")
    .update({ status: "closed" })
    .eq("status", "active")
    .lt("end_time", new Date().toISOString());

  // Update scheduled polls that should be active
  await supabase
    .from("polls")
    .update({ status: "active" })
    .eq("status", "scheduled")
    .lte("start_time", new Date().toISOString());
};

// Active Polls Card
export function ActivePollsCard({ polls }: { polls: Poll[] }) {
  useEffect(() => {
    updatePollStatuses();
  }, []);

  return (
    <motion.div initial='hidden' animate='visible' variants={cardVariants}>
      <Card className='overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-emerald-500/10 transition-all duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-tawakal-green/10 to-transparent rounded-lg -z-10'></div>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <div>
            <CardTitle className='text-tawakal-green'>Active Polls</CardTitle>
            <CardDescription>
              Polls currently available for voting
            </CardDescription>
          </div>
          <Check className='h-5 w-5 text-tawakal-green' />
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No active polls at the moment.
            </p>
          ) : (
            <div className='space-y-4'>
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  custom={index}
                  initial='hidden'
                  animate='visible'
                  variants={listItemVariants}
                  className='flex justify-between border-b border-tawakal-green/20 pb-2'>
                  <div>
                    <Link
                      href={`/polls/${poll.id}`}
                      className='font-medium hover:text-tawakal-green hover:underline transition-colors'>
                      {poll.title}
                    </Link>
                    <p className='text-xs text-muted-foreground'>
                      Ends: {formatDate(poll.end_time)}
                    </p>
                  </div>
                  <Link
                    href={`/polls/${poll.id}/vote`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "bg-tawakal-green hover:bg-tawakal-green/80 text-white"
                    )}>
                    Vote
                  </Link>
                </motion.div>
              ))}
              <Link
                href='/polls?status=active'
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full text-tawakal-green hover:text-tawakal-green/80 hover:bg-tawakal-green/10"
                )}>
                View All Active Polls
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Upcoming Polls Card
export function UpcomingPollsCard({ polls }: { polls: Poll[] }) {
  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={cardVariants}
      transition={{ delay: 0.2 }}>
      <Card className='overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-blue-500/10 transition-all duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-tawakal-blue/10 to-transparent rounded-lg -z-10'></div>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <div>
            <CardTitle className='text-tawakal-blue'>Upcoming Polls</CardTitle>
            <CardDescription>Polls scheduled for the future</CardDescription>
          </div>
          <CalendarClock className='h-5 w-5 text-tawakal-blue' />
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No upcoming polls scheduled.
            </p>
          ) : (
            <div className='space-y-4'>
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  custom={index}
                  initial='hidden'
                  animate='visible'
                  variants={listItemVariants}
                  className='border-b border-tawakal-blue/20 pb-2'>
                  <div>
                    <p className='font-medium text-tawakal-blue/90'>
                      {poll.title}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      Starts: {formatDate(poll.start_time)}
                    </p>
                  </div>
                </motion.div>
              ))}
              <Link
                href='/polls?status=scheduled'
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full text-tawakal-blue hover:text-tawakal-blue/80 hover:bg-tawakal-blue/10"
                )}>
                View All Upcoming Polls
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Closed Polls Card with Results
export function ClosedPollsCard({ polls }: { polls: Poll[] }) {
  return (
    <motion.div
      initial='hidden'
      animate='visible'
      variants={cardVariants}
      transition={{ delay: 0.4 }}>
      <Card className='overflow-hidden bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-orange-500/10 transition-all duration-300'>
        <div className='absolute inset-0 bg-gradient-to-br from-tawakal-gold/10 to-transparent rounded-lg -z-10'></div>
        <CardHeader className='flex flex-row items-center justify-between pb-2'>
          <div>
            <CardTitle className='text-tawakal-gold'>Recent Results</CardTitle>
            <CardDescription>Recently closed polls</CardDescription>
          </div>
          <TimerOff className='h-5 w-5 text-tawakal-gold' />
        </CardHeader>
        <CardContent>
          {polls.length === 0 ? (
            <p className='text-sm text-muted-foreground'>
              No recent poll results.
            </p>
          ) : (
            <div className='space-y-4'>
              {polls.map((poll, index) => (
                <motion.div
                  key={poll.id}
                  custom={index}
                  initial='hidden'
                  animate='visible'
                  variants={listItemVariants}
                  className='flex justify-between border-b border-tawakal-gold/20 pb-2'>
                  <div>
                    <Link
                      href={`/polls/${poll.id}`}
                      className='font-medium hover:text-tawakal-gold hover:underline transition-colors'>
                      {poll.title}
                    </Link>
                    <p className='text-xs text-muted-foreground'>
                      Closed: {formatDate(poll.end_time)}
                    </p>
                  </div>
                  <Link
                    href={`/polls/${poll.id}/results`}
                    className={cn(
                      buttonVariants({ size: "sm" }),
                      "bg-tawakal-gold hover:bg-tawakal-gold/80 text-white"
                    )}>
                    Results
                  </Link>
                </motion.div>
              ))}
              <Link
                href='/polls?status=closed'
                className={cn(
                  buttonVariants({ variant: "ghost" }),
                  "w-full text-tawakal-gold hover:text-tawakal-gold/80 hover:bg-tawakal-gold/10"
                )}>
                View All Results
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
