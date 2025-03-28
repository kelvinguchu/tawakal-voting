"use client";

import { useState, useEffect } from "react";
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
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Poll, PollOption } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { DrawerClose } from "@/components/ui/drawer";
import { submitVote, getUserVote } from "@/app/actions/polls/vote-on-poll";
import {
  fetchPollWithOptions,
  fetchPollOptionImages,
} from "@/app/actions/polls/fetch-poll-data";
import { createClient } from "@/lib/supabase/client";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkedVoteStatus, setCheckedVoteStatus] = useState(false);

  // Direct check for existing votes
  const checkDirectVoteStatus = async () => {
    try {
      // First try direct query
      const { data: existingVote, error } = await supabase
        .from("votes")
        .select("option_id")
        .eq("poll_id", pollId)
        .eq("user_id", userId)
        .single();

      if (error) {
        return false;
      }

      if (existingVote) {
        setUserVote(existingVote.option_id);
        setSelectedOption(existingVote.option_id);
        setCheckedVoteStatus(true);
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  };

  // Function to fetch poll data (can be called after voting)
  const fetchPollDetails = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // First, directly check if the user has already voted using Supabase client
      if (!checkedVoteStatus) {
        const directFound = await checkDirectVoteStatus();

        if (!directFound) {
          // Then try the server action as backup
          const voteResult = await getUserVote(pollId);

          if (voteResult.success && voteResult.optionId) {
            setUserVote(voteResult.optionId);
            setSelectedOption(voteResult.optionId);
            setCheckedVoteStatus(true);
          }
        }
      }

      // Fetch poll data with options and vote counts using server action
      const pollData = await fetchPollWithOptions(pollId, userId);

      if (!pollData) {
        throw new Error("Failed to fetch poll data");
      }

      setPoll(pollData);
      setOptions(pollData.poll_options || []);

      // Double check user's vote status to be certain
      if (pollData.user_vote) {
        setUserVote(pollData.user_vote);
        setSelectedOption(pollData.user_vote);
        setCheckedVoteStatus(true);
      }

      // Set results from the fetched data
      if (pollData.results) {
        setResults(pollData.results);
        setTotalVotes(pollData.total_votes || 0);
      }

      // Fetch option images using server action
      const images = await fetchPollOptionImages(pollId);
      setOptionImages(images);
    } catch (error) {
      setErrorMessage("Failed to load poll details");
      toast.error("Failed to load poll details");
    } finally {
      setLoading(false);
    }
  };

  // Get poll details on initial load
  useEffect(() => {
    // Immediately check if user has already voted
    const checkVoteStatus = async () => {
      try {
        // First try direct check
        const directFound = await checkDirectVoteStatus();

        if (!directFound) {
          // Then try server action as backup
          const voteResult = await getUserVote(pollId);
          if (voteResult.success && voteResult.optionId) {
            setUserVote(voteResult.optionId);
            setSelectedOption(voteResult.optionId);
            setCheckedVoteStatus(true);
          }
        }
      } catch (error) {
        // Silent failure
      }
    };

    checkVoteStatus().then(() => fetchPollDetails());
  }, [pollId, userId]);

  const handleVote = async () => {
    if (!selectedOption) {
      toast.error("Please select an option to vote");
      return;
    }

    // Don't allow voting if already voted
    if (userVote) {
      toast.error("You have already voted in this poll");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      // Call the server action for vote submission
      const result = await submitVote(pollId, selectedOption);

      if (!result.success) {
        setErrorMessage(result.message);
        toast.error(result.message);

        // If the error is because the user already voted, update the UI state
        if (result.message.includes("already voted") && result.optionId) {
          setUserVote(result.optionId);
          setCheckedVoteStatus(true);
        }
        return;
      }

      setUserVote(result.optionId || selectedOption);
      setCheckedVoteStatus(true);
      toast.success(result.message);

      // Refresh poll data to get updated vote counts
      await fetchPollDetails();
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.");
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

  // Helper function to check if a date is within a few minutes of now
  const isNearCurrentTime = (
    dateString: string | null,
    minutes: number = 5
  ): boolean => {
    if (!dateString) return false;

    const date = new Date(dateString);
    const now = new Date();

    // Check if the date is within X minutes of current time
    const timeWindow = minutes * 60 * 1000; // X minutes in milliseconds
    return Math.abs(date.getTime() - now.getTime()) < timeWindow;
  };

  // Simplified logic that relies more on the database status
  // and only adjusts for edge cases
  const hasVoted = !!userVote || checkedVoteStatus;

  const isPollAcceptingVotes =
    // Must be active status
    poll?.status === "active" &&
    // Must not be past end time
    poll.end_time &&
    new Date() < new Date(poll.end_time) &&
    // User must not have voted (double check both vote info sources)
    !userVote &&
    !hasVoted;

  const isPollScheduled = poll?.status === "scheduled";

  const isPollClosed =
    poll?.status === "closed" ||
    (poll?.status === "active" &&
      poll.end_time &&
      new Date() >= new Date(poll.end_time));

  const showResults = hasVoted || isPollScheduled || isPollClosed;

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
    <div className='space-y-6 w-full max-h-[85vh] overflow-y-auto px-1'>
      <div className='flex items-center justify-between gap-2 sticky top-0 bg-background z-10 py-2'>
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
        <CardHeader className='sticky top-14 bg-card z-10'>
          <div className='flex justify-between items-center'>
            <CardTitle className='text-2xl'>{poll?.title}</CardTitle>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => {
                setLoading(true);
                fetchPollDetails().then(() => setLoading(false));
              }}
              disabled={loading}
              title='Refresh poll data'>
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
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
          {hasVoted && (
            <Alert className='bg-tawakal-green/10 border-tawakal-green/20'>
              <CheckCircle2 className='h-4 w-4 text-tawakal-green' />
              <AlertTitle className='text-tawakal-green font-semibold'>
                You have already voted
              </AlertTitle>
              <AlertDescription>
                Your vote has been recorded for this poll. You can see the
                current results below.
                {userVote && options.find((o) => o.id === userVote) && (
                  <span className='block mt-1 font-medium'>
                    You voted for:{" "}
                    {options.find((o) => o.id === userVote)?.option_text}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Display alert if poll is closed */}
          {isPollClosed && (
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
          {isPollScheduled && (
            <Alert className='bg-tawakal-blue/10 border-tawakal-blue/20'>
              <Calendar className='h-4 w-4 text-tawakal-blue' />
              <AlertTitle className='text-tawakal-blue'>
                Poll is scheduled
              </AlertTitle>
              <AlertDescription>
                This poll will open for voting on {formatDate(poll.start_time)}.
                Please check back then to cast your vote.
              </AlertDescription>
            </Alert>
          )}

          {/* Display any error messages */}
          {errorMessage && (
            <Alert className='bg-red-50 border-red-200'>
              <X className='h-4 w-4 text-red-500' />
              <AlertTitle className='text-red-600'>Error</AlertTitle>
              <AlertDescription>{errorMessage}</AlertDescription>
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
                      !hasVoted && !showResults
                        ? "cursor-pointer hover:border-tawakal-green/50"
                        : "cursor-default",
                      selectedOption === option.id &&
                        "border-tawakal-green bg-tawakal-green/5",
                      userVote === option.id &&
                        "border-tawakal-green bg-tawakal-green/5"
                    )}
                    onClick={() => {
                      // Extra check to prevent clicking after vote
                      if (
                        !userVote &&
                        !hasVoted &&
                        !showResults &&
                        !submitting
                      ) {
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
        <CardFooter className='flex justify-between sticky bottom-0 bg-card z-10 border-t py-4'>
          <DrawerClose asChild>
            <Button variant='outline'>
              <X className='mr-2 h-4 w-4' />
              Close
            </Button>
          </DrawerClose>
          {isPollAcceptingVotes && !hasVoted && (
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
          {isPollScheduled && (
            <Button
              disabled
              className='bg-tawakal-blue/20 text-tawakal-blue cursor-not-allowed'>
              <Calendar className='mr-2 h-4 w-4' />
              Opens {formatDate(poll?.start_time, false)}
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
