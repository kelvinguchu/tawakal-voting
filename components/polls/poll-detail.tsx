"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Clock,
  Calendar,
  TimerOff,
  CheckCircle2,
  Loader2,
  Info,
  RefreshCw,
  ZoomIn,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Poll, PollOption } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
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

// Image lightbox component
function ImageLightbox({
  imageUrl,
  altText,
  isOpen,
  onClose,
}: Readonly<{
  imageUrl: string;
  altText: string;
  isOpen: boolean;
  onClose: () => void;
}>) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-4xl w-full p-0 bg-white border-none'>
        <DialogTitle className='sr-only'>View image: {altText}</DialogTitle>
        <div className='relative w-full h-[80vh] flex items-center justify-center'>
          <div className='relative w-full h-full'>
            <Image
              src={imageUrl}
              alt={altText}
              fill
              className='object-contain'
              sizes='(max-width: 768px) 100vw, 80vw'
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PollDetail({ pollId, userId }: Readonly<PollDetailProps>) {
  const router = useRouter();
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
  // Image lightbox state
  const [lightboxImage, setLightboxImage] = useState<{
    url: string;
    alt: string;
  } | null>(null);

  const handleImageClick = (imageUrl: string, optionText: string) => {
    setLightboxImage({ url: imageUrl, alt: optionText });
  };

  const closeLightbox = () => {
    setLightboxImage(null);
  };

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
      console.error("Error checking direct vote status:", error);
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
        setTotalVotes(pollData.total_votes ?? 0);
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

      setUserVote(result.optionId ?? selectedOption);
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
          <Button onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='w-full space-y-4 sm:space-y-6'>
      {/* Image Lightbox */}
      {lightboxImage && (
        <ImageLightbox
          imageUrl={lightboxImage.url}
          altText={lightboxImage.alt}
          isOpen={!!lightboxImage}
          onClose={closeLightbox}
        />
      )}

      {/* Poll Header */}
      <div className='space-y-3 sm:space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
          <div className='flex-1'>
            <h1 className='text-xl sm:text-2xl lg:text-3xl font-bold text-tawakal-blue mb-2 sm:mb-3 leading-tight'>
              {poll.title}
            </h1>
            <div className='flex items-center'>
              <div
                className={cn(
                  "flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium",
                  statusInfo?.bgColor,
                  statusInfo?.color
                )}>
                {statusInfo?.icon}
                <span className='ml-1 sm:ml-2'>{statusInfo?.text}</span>
              </div>
            </div>
          </div>
          <Button
            variant='outline'
            size='sm'
            onClick={() => {
              setLoading(true);
              fetchPollDetails().then(() => setLoading(false));
            }}
            disabled={loading}
            title='Refresh poll data'
            className='w-full sm:w-auto h-9 text-sm'>
            <RefreshCw
              className={`h-3 w-3 sm:h-4 sm:w-4 ${
                loading ? "animate-spin" : ""
              }`}
            />
            <span className='ml-2 sm:inline'>Refresh</span>
          </Button>
        </div>

        {poll.description && (
          <div className='bg-muted/30 rounded-lg p-3 sm:p-4'>
            <p className='text-sm sm:text-base text-muted-foreground'>
              {poll.description}
            </p>
          </div>
        )}
      </div>

      {/* Status Alerts */}
      {hasVoted && (
        <Alert className='bg-tawakal-green/10 border-tawakal-green/20'>
          <CheckCircle2 className='h-4 w-4 text-tawakal-green' />
          <AlertTitle className='text-tawakal-green font-semibold'>
            You have already voted
          </AlertTitle>
          <AlertDescription>
            {userVote && options.find((o) => o.id === userVote) && (
              <span className='block mt-1 font-medium'>
                You voted for:{" "}
                {options.find((o) => o.id === userVote)?.option_text}
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isPollClosed && (
        <Alert className='bg-tawakal-gold/10 border-tawakal-gold/20'>
          <TimerOff className='h-4 w-4 text-tawakal-gold' />
          <AlertTitle className='text-tawakal-gold'>Poll is closed</AlertTitle>
          <AlertDescription>
            This poll has ended. Voting is no longer available.
          </AlertDescription>
        </Alert>
      )}

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

      {errorMessage && (
        <Alert className='bg-red-50 border-red-200'>
          <Info className='h-4 w-4 text-red-500' />
          <AlertTitle className='text-red-600'>Error</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      {/* Options Section */}
      <div className='space-y-3 sm:space-y-4'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4'>
          <h2 className='text-lg sm:text-xl font-semibold'>
            {showResults ? "Results" : "Vote Options"}
          </h2>
          {showResults && totalVotes > 0 && (
            <p className='text-xs sm:text-sm text-muted-foreground'>
              Total votes: {totalVotes}
            </p>
          )}
        </div>
        {/* Hint about image viewing */}
        {options.some((option) => optionImages[option.id]) && (
          <p className='text-xs sm:text-sm text-muted-foreground flex items-center gap-1'>
            <ZoomIn className='h-3 w-3' />
            <span className='hidden sm:inline'>
              Click on images to view them in full size
            </span>
            <span className='sm:hidden'>Tap images to enlarge</span>
          </p>
        )}

        <div className='grid gap-3 sm:gap-4 max-w-4xl'>
          {options.map((option) => {
            const voteCount = results[option.id] || 0;
            const votePercentage =
              totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;

            return (
              <div
                key={option.id}
                className={cn(
                  "border rounded-lg p-4 sm:p-6 relative transition-all hover:shadow-sm",
                  !hasVoted && !showResults
                    ? "cursor-pointer hover:border-tawakal-green/50 hover:bg-tawakal-green/5"
                    : "cursor-default",
                  selectedOption === option.id &&
                    "border-tawakal-green bg-tawakal-green/5",
                  userVote === option.id &&
                    "border-tawakal-green bg-tawakal-green/10"
                )}
                onClick={() => {
                  // Extra check to prevent clicking after vote
                  if (!userVote && !hasVoted && !showResults && !submitting) {
                    setSelectedOption(option.id);
                  }
                }}>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-6 items-start sm:items-center'>
                  {optionImages[option.id] && (
                    <div className='relative flex-shrink-0 self-center sm:self-start'>
                      <div
                        className='w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden relative cursor-pointer group'
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageClick(
                            optionImages[option.id],
                            option.option_text
                          );
                        }}>
                        <Image
                          src={optionImages[option.id]}
                          alt={option.option_text}
                          fill
                          className='object-cover transition-transform group-hover:scale-105'
                        />
                        <div className='absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center'>
                          <ZoomIn className='h-4 w-4 sm:h-5 sm:w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity' />
                        </div>
                      </div>
                    </div>
                  )}
                  <div className='flex-grow space-y-2 w-full'>
                    <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-2'>
                      <div className='font-semibold text-base sm:text-lg'>
                        {option.option_text}
                      </div>
                      {showResults && (
                        <div className='text-left sm:text-right'>
                          <div className='text-lg sm:text-xl font-bold'>
                            {votePercentage}%
                          </div>
                          <div className='text-xs sm:text-sm text-muted-foreground'>
                            {voteCount} votes
                          </div>
                        </div>
                      )}
                    </div>

                    {showResults && (
                      <div className='space-y-1'>
                        <Progress
                          value={votePercentage}
                          className='h-3 bg-muted'
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
                      <CheckCircle2 className='h-6 w-6 text-tawakal-green' />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {isPollAcceptingVotes && !hasVoted && (
        <div className='flex justify-center pt-4 sm:pt-6'>
          <Button
            onClick={handleVote}
            disabled={!selectedOption || submitting}
            size='lg'
            className='w-full sm:w-auto bg-tawakal-green hover:bg-tawakal-green/90 px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base'>
            {submitting ? (
              <>
                <Loader2 className='mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin' />
                <span className='hidden sm:inline'>Submitting Vote...</span>
                <span className='sm:hidden'>Submitting...</span>
              </>
            ) : (
              <>
                <span className='hidden sm:inline'>Submit Your Vote</span>
                <span className='sm:hidden'>Submit Vote</span>
              </>
            )}
          </Button>
        </div>
      )}

      {isPollScheduled && (
        <div className='flex justify-center pt-4 sm:pt-6'>
          <Button
            disabled
            size='lg'
            className='w-full sm:w-auto bg-tawakal-blue/20 text-tawakal-blue cursor-not-allowed px-6 sm:px-8 h-11 sm:h-12 text-sm sm:text-base'>
            <Calendar className='mr-2 h-4 w-4 sm:h-5 sm:w-5' />
            <span className='hidden sm:inline'>
              Opens {formatDate(poll?.start_time, false)}
            </span>
            <span className='sm:hidden'>
              Opens {formatDate(poll?.start_time, false)}
            </span>
          </Button>
        </div>
      )}
    </div>
  );
}

function PollDetailSkeleton() {
  return (
    <div className='w-full space-y-6'>
      {/* Header Skeleton */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='flex-1'>
            <Skeleton className='h-8 w-2/3 mb-2' />
            <Skeleton className='h-6 w-48' />
          </div>
          <Skeleton className='h-9 w-24' />
        </div>
        <Skeleton className='h-16 w-full' />
      </div>

      {/* Options Skeleton */}
      <div className='space-y-4'>
        <Skeleton className='h-6 w-32' />
        <div className='grid gap-4 max-w-4xl'>
          {[1, 2, 3].map((i) => (
            <div key={i} className='border rounded-lg p-6'>
              <div className='flex gap-6 items-center'>
                <Skeleton className='w-20 h-20 rounded-lg' />
                <div className='flex-grow space-y-2'>
                  <Skeleton className='h-6 w-full' />
                  <Skeleton className='h-3 w-full' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Button Skeleton */}
      <div className='flex justify-center pt-4'>
        <Skeleton className='h-11 w-48' />
      </div>
    </div>
  );
}
