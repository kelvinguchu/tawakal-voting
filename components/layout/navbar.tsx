"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className='fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 h-16'>
      <div className='container mx-auto h-full px-4 py-3 flex items-center justify-between'>
        {/* Logo */}
        <Link href='/dashboard' className='flex items-center space-x-2'>
          <Image
            src='/logo.png'
            alt='Tawakal Express Logo'
            width={100}
            height={100}
          />
        </Link>

        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center space-x-6'>
          <Link
            href='/dashboard'
            className='text-sm font-medium hover:text-tawakal-green transition-colors'>
            Dashboard
          </Link>
          <Link
            href='/polls'
            className='text-sm font-medium hover:text-tawakal-green transition-colors'>
            Polls
          </Link>
          <Link
            href='/profile'
            className='text-sm font-medium hover:text-tawakal-green transition-colors'>
            Profile
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <Button
          variant='ghost'
          size='icon'
          className='md:hidden'
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          <Menu className='h-5 w-5' />
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className='md:hidden absolute w-full bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-md'>
          <div className='container mx-auto px-4 py-3 space-y-3'>
            <Link
              href='/dashboard'
              className='block text-sm font-medium hover:text-tawakal-green transition-colors py-2'
              onClick={() => setIsMobileMenuOpen(false)}>
              Dashboard
            </Link>
            <Link
              href='/polls'
              className='block text-sm font-medium hover:text-tawakal-green transition-colors py-2'
              onClick={() => setIsMobileMenuOpen(false)}>
              Polls
            </Link>
            <Link
              href='/profile'
              className='block text-sm font-medium hover:text-tawakal-green transition-colors py-2'
              onClick={() => setIsMobileMenuOpen(false)}>
              Profile
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
