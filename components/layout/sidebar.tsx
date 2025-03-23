"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { User } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { Home, ListChecks, Users, LogOut } from "lucide-react";
import { motion } from "framer-motion";

interface SidebarProps {
  user: User | null;
  signOut: () => Promise<void>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export function Sidebar({
  user,
  signOut,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: SidebarProps) {
  const pathname = usePathname();

  // Navigation items
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className='h-5 w-5' />,
      activePattern: /^\/dashboard$/,
      color: "text-tawakal-green",
      bgColor: "bg-tawakal-green",
    },
    {
      name: "Polls",
      href: "/polls",
      icon: <ListChecks className='h-5 w-5' />,
      activePattern: /^\/polls/,
      color: "text-tawakal-blue",
      bgColor: "bg-tawakal-blue",
    },
  ];

  // Admin-only navigation items
  const adminNavItems = [
    {
      name: "Users",
      href: "/admin/users",
      icon: <Users className='h-5 w-5' />,
      activePattern: /^\/admin\/users/,
      color: "text-tawakal-red",
      bgColor: "bg-tawakal-red",
    },
  ];

  const sidebarVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { duration: 0.3 } },
  };

  const userVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.6, duration: 0.4 } },
  };

  return (
    <div
      className={cn(
        "w-full backdrop-blur-sm bg-white/70 dark:bg-black/30 border-r border-white/10 md:w-64 md:flex md:flex-col z-20",
        isMobileMenuOpen ? "block" : "hidden"
      )}>
      <div className='hidden p-6 text-xl font-bold md:block bg-gradient-to-r from-tawakal-green to-tawakal-blue bg-clip-text text-transparent'>
        Voting System
      </div>

      <motion.div
        className='flex flex-col p-4'
        variants={sidebarVariants}
        initial='hidden'
        animate='visible'>
        <div className='py-2'>
          <p className='mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
            General
          </p>
          <nav className='space-y-1'>
            {navItems.map((item) => (
              <motion.div key={item.href} variants={itemVariants}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300",
                    item.activePattern.test(pathname)
                      ? `${item.bgColor} text-white`
                      : `hover:bg-muted hover:${item.color}`
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}>
                  <span
                    className={`${
                      item.activePattern.test(pathname)
                        ? "text-white"
                        : item.color
                    }`}>
                    {item.icon}
                  </span>
                  {item.name}
                </Link>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Admin navigation section */}
        {user?.role === "admin" && (
          <div className='py-2'>
            <p className='mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground'>
              Administration
            </p>
            <nav className='space-y-1'>
              {adminNavItems.map((item) => (
                <motion.div key={item.href} variants={itemVariants}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-300",
                      item.activePattern.test(pathname)
                        ? `${item.bgColor} text-white`
                        : `hover:bg-muted hover:${item.color}`
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}>
                    <span
                      className={`${
                        item.activePattern.test(pathname)
                          ? "text-white"
                          : item.color
                      }`}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
        )}
      </motion.div>

      {/* User section at the bottom */}
      <motion.div
        className='mt-auto border-t border-white/10 p-4 bg-white/20 dark:bg-black/20 backdrop-blur-sm'
        variants={userVariants}
        initial='hidden'
        animate='visible'>
        <div className='flex items-center justify-between'>
          <div>
            <p className='font-medium'>
              {user?.first_name} {user?.last_name}
            </p>
            <p className='text-xs text-muted-foreground'>{user?.email}</p>
          </div>
          <Button
            variant='ghost'
            size='icon'
            onClick={signOut}
            className='text-tawakal-red hover:bg-tawakal-red/10'>
            <LogOut className='h-5 w-5' />
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
