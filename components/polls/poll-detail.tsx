"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  Calendar,
  TimerOff,
  CheckCircle2,
  Loader2,
  Info,
  X,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Poll, PollOption, Vote } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DrawerClose } from "@/components/ui/drawer";

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

interface PollDetailProps {
  pollId: string;
  userId: string;
}

export function PollDetail({ pollId, userId }: PollDetailProps) {
  const supabase = createClient();
  const [poll, setPoll] = useState<Poll | null>(null);
  const [options, setOptions] = useState<PollOption[]>([]);
  const [optionImages, setOptionImages] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, number>>({});
  const [totalVotes, setTotalVotes] = useState(0);

  // Get poll details
  useEffect(() => {
    const fetchPollDetails = async () => {
      setLoading(true);
      try {
        // Fetch poll data
        const { data: pollData, error: pollError } = await supabase
          .from("polls")
          .select("*")
          .eq("id", pollId)
          .single();

        if (pollError) {
          throw pollError;
        }

        setPoll(pollData);

        // Fetch poll options
        const { data: optionsData, error: optionsError } = await supabase
          .from("poll_options")
          .select("*")
          .eq("poll_id", pollId);

        if (optionsError) {
          throw optionsError;
        }

        setOptions(optionsData);

        // Check if user has already voted
        const { data: voteData, error: voteError } = await supabase
          .from("votes")
          .select("option_id")
          .eq("poll_id", pollId)
          .eq("user_id", userId)
          .single();

        if (voteData) {
          setUserVote(voteData.option_id);
          setSelectedOption(voteData.option_id);
        }

        // Fetch votes and count them manually instead of using group
        const { data: votesData, error: votesError } = await supabase
          .from("votes")
          .select("option_id")
          .eq("poll_id", pollId);

        if (!votesError && votesData) {
          const resultsObj: Record<string, number> = {};
          let total = 0;

          // Count by iterating through the votes
          for (const vote of votesData) {
            if (!resultsObj[vote.option_id]) {
              resultsObj[vote.option_id] = 0;
            }
            resultsObj[vote.option_id]++;
            total++;
          }

          setResults(resultsObj);
          setTotalVotes(total);
        }

        // Fetch option images
        for (const option of optionsData) {
          const { data: mediaData, error: mediaError } = await supabase
            .from("option_media")
            .select("storage_path")
            .eq("option_id", option.id)
            .single();

          if (!mediaError && mediaData) {
            const { data: imageUrl } = await supabase.storage
              .from("vote-media")
              .createSignedUrl(mediaData.storage_path, 60 * 60); // 1 hour expiry

            if (imageUrl) {
              setOptionImages((prev) => ({
                ...prev,
                [option.id]: imageUrl.signedUrl,
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error fetching poll details:", error);
        toast.error("Failed to load poll details");
      } finally {
        setLoading(false);
      }
    };

    fetchPollDetails();
  }, [pollId, userId, supabase]);

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error("Please select an option to vote");
      return;
    }

    setSubmitting(true);

    try {
      // Check if poll is still active
      if (poll?.status !== "active") {
        toast.error("This poll is no longer active");
        return;
      }

      // Submit vote
      const { data, error } = await supabase.from("votes").insert({
        poll_id: pollId,
        option_id: selectedOption,
        user_id: userId,
      });

      if (error) {
        console.error("Error submitting vote:", error);
        if (error.code === "23505") {
          toast.error("You have already voted in this poll");
        } else {
          toast.error("Failed to submit vote. Please try again.");
        }
        return;
      }

      setUserVote(selectedOption);
      toast.success("Your vote has been submitted successfully!");

      // Refetch votes and count them manually
      const { data: votesData, error: votesError } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", pollId);

      if (!votesError && votesData) {
        const resultsObj: Record<string, number> = {};
        let total = 0;

        // Count by iterating through the votes
        for (const vote of votesData) {
          if (!resultsObj[vote.option_id]) {
            resultsObj[vote.option_id] = 0;
          }
          resultsObj[vote.option_id]++;
          total++;
        }

        setResults(resultsObj);
        setTotalVotes(total);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const getPollStatusInfo = () => {
    if (!poll) return null;

    switch (poll.status) {
      case "active":
        return {
          icon: <Clock className='h-5 w-5 text-tawakal-green' />,
          text: `Active until ${formatDate(poll.end_time)}`,
          color: "text-tawakal-green",
          bgColor: "bg-tawakal-green/10",
        };
      case "scheduled":
        return {
          icon: <Calendar className='h-5 w-5 text-tawakal-blue' />,
          text: `Starts on ${formatDate(poll.start_time)}`,
          color: "text-tawakal-blue",
          bgColor: "bg-tawakal-blue/10",
        };
      case "closed":
        return {
          icon: <TimerOff className='h-5 w-5 text-tawakal-gold' />,
          text: `Closed on ${formatDate(poll.end_time)}`,
          color: "text-tawakal-gold",
          bgColor: "bg-tawakal-gold/10",
        };
      default:
        return {
          icon: <Info className='h-5 w-5' />,
          text: "Unknown status",
          color: "text-muted-foreground",
          bgColor: "bg-muted",
        };
    }
  };

  const statusInfo = getPollStatusInfo();
  const isPollActive = poll?.status === "active";
  const hasVoted = !!userVote;
  const showResults = hasVoted || !isPollActive;

  if (loading) {
    return <PollDetailSkeleton />;
  }

  if (!poll) {
    return (
      <div className='flex flex-col items-center justify-center py-12'>
        <div className='text-center space-y-4'>
          <h2 className='text-2xl font-bold'>Poll Not Found</h2>
          <p className='text-muted-foreground'>
            The poll you're looking for doesn't exist or has been removed.
          </p>
          <DrawerClose asChild>
            <Button>
              <X className='mr-2 h-4 w-4' />
              Close
            </Button>
          </DrawerClose>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6 w-full'>
      <div className='flex items-center justify-between gap-2'>
        <Button variant='ghost' size='sm' asChild>
          <Link href='/polls'>
            <ArrowLeft className='h-4 w-4 mr-1' />
            Back to Polls
          </Link>
        </Button>
        <DrawerClose asChild>
          <Button variant='ghost' size='sm'>
            <X className='h-4 w-4 mr-1' />
            Close
          </Button>
        </DrawerClose>
      </div>

      <Card className='w-full'>
        <CardHeader>
          <CardTitle className='text-2xl'>{poll.title}</CardTitle>
          <CardDescription>
            <div className='flex items-center mt-2'>
              <div
                className={cn(
                  "flex items-center px-3 py-1 rounded-full text-sm",
                  statusInfo?.bgColor,
                  statusInfo?.color
                )}>
                {statusInfo?.icon}
                <span className='ml-2'>{statusInfo?.text}</span>
              </div>
            </div>
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {poll.description && (
            <div className='border-b pb-4'>
              <p className='text-muted-foreground'>{poll.description}</p>
            </div>
          )}

          {/* Display alert if user has already voted */}
          {hasVoted && isPollActive && (
            <Alert className='bg-tawakal-green/10 border-tawakal-green/20'>
              <CheckCircle2 className='h-4 w-4 text-tawakal-green' />
              <AlertTitle className='text-tawakal-green'>
                You have voted
              </AlertTitle>
              <AlertDescription>
                You have already submitted your vote for this poll.
              </AlertDescription>
            </Alert>
          )}

          {/* Display alert if poll is closed */}
          {!isPollActive && poll.status === "closed" && (
            <Alert className='bg-tawakal-gold/10 border-tawakal-gold/20'>
              <TimerOff className='h-4 w-4 text-tawakal-gold' />
              <AlertTitle className='text-tawakal-gold'>
                Poll is closed
              </AlertTitle>
              <AlertDescription>
                This poll has ended. Voting is no longer available.
              </AlertDescription>
            </Alert>
          )}

          {/* Display alert if poll is scheduled */}
          {!isPollActive && poll.status === "scheduled" && (
            <Alert className='bg-tawakal-blue/10 border-tawakal-blue/20'>
              <Calendar className='h-4 w-4 text-tawakal-blue' />
              <AlertTitle className='text-tawakal-blue'>
                Poll is scheduled
              </AlertTitle>
              <AlertDescription>
                This poll is not yet active. Voting will begin on{" "}
                {formatDate(poll.start_time)}.
              </AlertDescription>
            </Alert>
          )}

          <div className='space-y-4'>
            <h3 className='text-lg font-medium'>
              {showResults ? "Results" : "Options"}
            </h3>
            <div className='space-y-3'>
              {options.map((option) => {
                const voteCount = results[option.id] || 0;
                const votePercentage =
                  totalVotes > 0
                    ? Math.round((voteCount / totalVotes) * 100)
                    : 0;

                return (
                  <div
                    key={option.id}
                    className={cn(
                      "border rounded-lg p-4 relative transition-all",
                      showResults
                        ? "cursor-default"
                        : "cursor-pointer hover:border-tawakal-green/50",
                      selectedOption === option.id &&
                        "border-tawakal-green bg-tawakal-green/5",
                      userVote === option.id &&
                        "border-tawakal-green bg-tawakal-green/5"
                    )}
                    onClick={() => {
                      if (!showResults && !submitting) {
                        setSelectedOption(option.id);
                      }
                    }}>
                    <div className='flex gap-4 items-center'>
                      {optionImages[option.id] && (
                        <div className='w-16 h-16 rounded-md overflow-hidden relative flex-shrink-0'>
                          <Image
                            src={optionImages[option.id]}
                            alt={option.option_text}
                            fill
                            className='object-cover'
                          />
                        </div>
                      )}
                      <div className='flex-grow'>
                        <div className='flex items-center justify-between'>
                          <div className='font-medium'>
                            {option.option_text}
                          </div>
                          {showResults && (
                            <div className='text-sm font-medium'>
                              {votePercentage}% ({voteCount} votes)
                            </div>
                          )}
                        </div>

                        {showResults && (
                          <div className='mt-2'>
                            <Progress
                              value={votePercentage}
                              className='h-2 bg-muted'
                              indicatorClassName={
                                userVote === option.id
                                  ? "bg-tawakal-green"
                                  : "bg-tawakal-blue/60"
                              }
                            />
                          </div>
                        )}
                      </div>

                      {userVote === option.id && (
                        <div className='flex-shrink-0'>
                          <CheckCircle2 className='h-5 w-5 text-tawakal-green' />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <DrawerClose asChild>
            <Button variant='outline'>
              <X className='mr-2 h-4 w-4' />
              Close
            </Button>
          </DrawerClose>
          {isPollActive && !hasVoted && (
            <Button
              onClick={handleVote}
              disabled={!selectedOption || submitting}
              className='bg-tawakal-green hover:bg-tawakal-green/90'>
              {submitting ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Submitting...
                </>
              ) : (
                "Submit Vote"
              )}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

function PollDetailSkeleton() {
  return (
    <div className='space-y-6 w-full'>
      <div className='flex items-center justify-between gap-2'>
        <Skeleton className='h-9 w-24' />
        <Skeleton className='h-9 w-24' />
      </div>

      <Card className='w-full'>
        <CardHeader>
          <Skeleton className='h-8 w-2/3' />
          <div className='mt-2'>
            <Skeleton className='h-6 w-48' />
          </div>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='border-b pb-4'>
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6 mt-2' />
            <Skeleton className='h-4 w-4/6 mt-2' />
          </div>

          <div className='space-y-4'>
            <Skeleton className='h-6 w-24' />
            <div className='space-y-3'>
              {[1, 2, 3].map((i) => (
                <div key={i} className='border rounded-lg p-4'>
                  <div className='flex gap-4 items-center'>
                    <Skeleton className='w-16 h-16 rounded-md' />
                    <div className='flex-grow'>
                      <Skeleton className='h-5 w-full' />
                      <Skeleton className='h-2 w-full mt-2' />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
        <CardFooter className='flex justify-between'>
          <Skeleton className='h-10 w-32' />
          <Skeleton className='h-10 w-32' />
        </CardFooter>
      </Card>
    </div>
  );
}
