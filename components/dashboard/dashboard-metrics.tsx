"use client";

import { CheckCircle, BarChart3, Calendar } from "lucide-react";

interface DashboardMetricsProps {
  voteCount: number;
  activePollsCount: number;
  upcomingPollsCount: number;
  isAdmin: boolean;
}

export function DashboardMetrics({
  voteCount,
  activePollsCount,
  upcomingPollsCount,
}: Readonly<DashboardMetricsProps>) {
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 my-6 sm:my-8'>
      {/* Your Participation */}
      <div className='border-2 sm:border rounded-lg p-4 sm:p-5 relative hover:shadow-sm transition-shadow'>
        <div className='flex items-start'>
          <div className='bg-tawakal-blue/10 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0'>
            <CheckCircle className='h-4 w-4 sm:h-5 sm:w-5 text-tawakal-blue' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs sm:text-sm text-muted-foreground mb-1'>
              Your Participation
            </p>
            <div className='flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1'>
              <span className='text-xl sm:text-2xl font-bold leading-tight'>
                {voteCount}
              </span>
              <span className='text-xs sm:text-sm text-muted-foreground'>
                <span className='hidden sm:inline'>votes cast</span>
                <span className='sm:hidden'>votes</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Polls */}
      <div className='border-2 sm:border rounded-lg p-4 sm:p-5 relative hover:shadow-sm transition-shadow'>
        <div className='flex items-start'>
          <div className='bg-tawakal-gold/10 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0'>
            <BarChart3 className='h-4 w-4 sm:h-5 sm:w-5 text-tawakal-gold' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs sm:text-sm text-muted-foreground mb-1'>
              Active Polls
            </p>
            <div className='flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1'>
              <span className='text-xl sm:text-2xl font-bold leading-tight'>
                {activePollsCount}
              </span>
              <span className='text-xs sm:text-sm text-muted-foreground'>
                <span className='hidden sm:inline'>available now</span>
                <span className='sm:hidden'>available</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Polls */}
      <div className='border-2 sm:border rounded-lg p-4 sm:p-5 relative hover:shadow-sm transition-shadow sm:col-span-2 lg:col-span-1'>
        <div className='flex items-start'>
          <div className='bg-tawakal-green/10 p-2 sm:p-2.5 rounded-full mr-3 sm:mr-4 flex-shrink-0'>
            <Calendar className='h-4 w-4 sm:h-5 sm:w-5 text-tawakal-green' />
          </div>
          <div className='min-w-0 flex-1'>
            <p className='text-xs sm:text-sm text-muted-foreground mb-1'>
              Upcoming Polls
            </p>
            <div className='flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-1'>
              <span className='text-xl sm:text-2xl font-bold leading-tight'>
                {upcomingPollsCount}
              </span>
              <span className='text-xs sm:text-sm text-muted-foreground'>
                scheduled
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
