"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className='w-full border-t border-gray-200 dark:border-gray-800 mt-auto py-4 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md'>
      <div className='container mx-auto px-4'>
        <div className='flex flex-col items-center justify-center space-y-2 sm:flex-row sm:justify-between sm:space-y-0'>
          <p className='text-sm text-muted-foreground'>
            &copy; {new Date().getFullYear()} Tawakal Express. All rights
            reserved.
          </p>

          <div className='flex items-center space-x-1 text-sm text-muted-foreground'>
            <span>Developed By</span>
            <Link
              href='https://www.kulmi.digital/'
              target='_blank'
              rel='noopener noreferrer'
              className='font-medium hover:text-tawakal-green transition-colors underline-offset-4 hover:underline'>
              Kulmi Digital
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
