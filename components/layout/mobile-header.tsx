"use client";

import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export function MobileHeader({
  isMobileMenuOpen,
  toggleMobileMenu,
}: MobileHeaderProps) {
  return (
    <motion.div
      className='flex items-center justify-between border-b border-white/10 p-4 md:hidden bg-white/70 dark:bg-black/40 backdrop-blur-lg z-20'
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}>
      <div className='text-xl font-bold bg-gradient-to-r from-tawakal-green to-tawakal-blue bg-clip-text text-transparent'>
        Voting System
      </div>
      <Button
        variant='ghost'
        onClick={toggleMobileMenu}
        size='icon'
        className={
          isMobileMenuOpen
            ? "text-tawakal-red hover:bg-tawakal-red/10"
            : "text-tawakal-green hover:bg-tawakal-green/10"
        }>
        <motion.div
          initial={{ rotate: 0 }}
          animate={{ rotate: isMobileMenuOpen ? 90 : 0 }}
          transition={{ duration: 0.2 }}>
          {isMobileMenuOpen ? (
            <X className='h-6 w-6' />
          ) : (
            <Menu className='h-6 w-6' />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
}
