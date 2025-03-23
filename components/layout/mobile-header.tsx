"use client";

import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export function MobileHeader({
  isMobileMenuOpen,
  toggleMobileMenu,
}: MobileHeaderProps) {
  return (
    <div className='relative flex md:hidden h-14 items-center justify-between px-4 border-b bg-white/90 dark:bg-black/90 backdrop-blur-sm z-30 mt-16'>
      <div className='text-lg font-bold bg-gradient-to-r from-tawakal-green to-tawakal-blue bg-clip-text text-transparent'>
        Voting System
      </div>
      <Button
        variant='ghost'
        size='icon'
        onClick={toggleMobileMenu}
        aria-label='Toggle menu'>
        {isMobileMenuOpen ? (
          <X className='h-6 w-6' />
        ) : (
          <Menu className='h-6 w-6' />
        )}
      </Button>
    </div>
  );
}
