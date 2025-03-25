"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, ChevronDown, LogOut, User } from "lucide-react";
import { useState } from "react";
import { User as UserType } from "@/lib/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user: UserType | null;
  signOut: () => Promise<void>;
  setIsMobileMenuOpen: (value: boolean) => void;
  isMobileMenuOpen: boolean;
}

export default function Navbar({
  user,
  signOut,
  setIsMobileMenuOpen,
  isMobileMenuOpen,
}: NavbarProps) {
  return (
    <nav className='fixed top-0 w-full bg-white/80 dark:bg-gray-950/80 backdrop-blur-md z-50 border-b border-gray-200 dark:border-gray-800 h-16'>
      <div className='w-full h-full px-4 py-3 flex items-center justify-between'>
        {/* Logo */}
        <div className='flex items-center'>
          {/* Mobile Menu Button */}
          <Button
            variant='ghost'
            size='icon'
            className='md:hidden mr-2'
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            <Menu className='h-5 w-5' />
          </Button>

          <Link href='/dashboard' className='flex items-center space-x-2'>
            <Image
              src='/logo.png'
              alt='Tawakal Express Logo'
              width={100}
              height={100}
            />
          </Link>
        </div>

        {/* User Profile Dropdown */}
        <div className='flex items-center gap-2'>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                className='border-tawakal-blue/20 hover:bg-tawakal-blue/5 hover:border-tawakal-blue/30'>
                <span className='mr-2 hidden sm:inline-block font-medium'>
                  {user?.first_name} {user?.last_name}
                </span>
                <ChevronDown className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-56'>
              <DropdownMenuLabel>
                <p className='font-medium'>
                  {user?.first_name} {user?.last_name}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {user?.email}
                </p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href='/profile' className='cursor-pointer'>
                  <User className='h-4 w-4 mr-2' />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => signOut()}
                className='text-tawakal-red focus:text-tawakal-red cursor-pointer'>
                <LogOut className='h-4 w-4 mr-2' />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
