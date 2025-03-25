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
}: DashboardMetricsProps) {
  return (
    <div className='grid grid-cols-3 gap-6 my-8'>
      {/* Your Participation */}
      <div className='border rounded-lg p-4 relative'>
        <div className='flex items-start'>
          <div className='bg-tawakal-blue/10 p-2.5 rounded-full mr-3'>
            <CheckCircle className='h-5 w-5 text-tawakal-blue' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground mb-1'>
              Your Participation
            </p>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-bold'>{voteCount}</span>
              <span className='text-sm text-muted-foreground'>votes cast</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Polls */}
      <div className='border rounded-lg p-4 relative'>
        <div className='flex items-start'>
          <div className='bg-tawakal-gold/10 p-2.5 rounded-full mr-3'>
            <BarChart3 className='h-5 w-5 text-tawakal-gold' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground mb-1'>Active Polls</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-bold'>{activePollsCount}</span>
              <span className='text-sm text-muted-foreground'>
                available now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Polls */}
      <div className='border rounded-lg p-4 relative'>
        <div className='flex items-start'>
          <div className='bg-tawakal-green/10 p-2.5 rounded-full mr-3'>
            <Calendar className='h-5 w-5 text-tawakal-green' />
          </div>
          <div>
            <p className='text-sm text-muted-foreground mb-1'>Upcoming Polls</p>
            <div className='flex items-baseline gap-1'>
              <span className='text-2xl font-bold'>{upcomingPollsCount}</span>
              <span className='text-sm text-muted-foreground'>scheduled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
