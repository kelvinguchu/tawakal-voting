"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

interface NavigationLoaderProps {
  isLoading: boolean;
}

export function NavigationLoader({ isLoading }: NavigationLoaderProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isLoading) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center'>
      {/* Glassmorphic Background */}
      <div className='absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-md' />

      {/* Loading Animation */}
      <div className='relative z-10 flex flex-col items-center gap-6'>
        {/* Animated Logo/Spinner */}
        <div className='relative'>
          {/* Outer Ring */}
          <div className='w-20 h-20 border-4 border-tawakal-green/20 rounded-full animate-spin'>
            <div className='absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-tawakal-green rounded-full animate-pulse'></div>
          </div>

          {/* Inner Ring */}
          <div className='absolute inset-2 w-16 h-16 border-4 border-tawakal-blue/20 rounded-full animate-spin-reverse'>
            <div className='absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-tawakal-blue rounded-full animate-pulse delay-150'></div>
          </div>

          {/* Center Dot */}
          <div className='absolute inset-8 w-4 h-4 bg-gradient-to-r from-tawakal-green to-tawakal-blue rounded-full animate-pulse'></div>
        </div>

        {/* Loading Text */}
        <div className='text-center space-y-2'>
          <h3 className='text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white'>
            Loading...
          </h3>
          <div className='flex items-center gap-1'>
            <div className='w-2 h-2 bg-tawakal-green rounded-full animate-bounce'></div>
            <div className='w-2 h-2 bg-tawakal-blue rounded-full animate-bounce delay-100'></div>
            <div className='w-2 h-2 bg-tawakal-gold rounded-full animate-bounce delay-200'></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useNavigationLoader() {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();

  const startLoading = () => setIsLoading(true);
  const stopLoading = () => setIsLoading(false);

  // Auto-stop loading when pathname changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Small delay to ensure smooth transition

    return () => clearTimeout(timer);
  }, [pathname]);

  return {
    isLoading,
    startLoading,
    stopLoading,
  };
}
