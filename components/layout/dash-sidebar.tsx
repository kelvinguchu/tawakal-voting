"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types/database";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Home,
  ListChecks,
  Users,
  FileText,
  Settings,
  LogOut,
  ChevronRight,
  Bell,
  PlusCircle,
  UserCircle,
  Plus,
  X,
} from "lucide-react";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { CreatePollForm } from "@/components/forms/create-poll-form";
import { Geist_Mono } from "next/font/google";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

interface DashSidebarProps {
  user: User | null;
  signOut: () => Promise<void>;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (value: boolean) => void;
}

export function DashSidebar({
  user,
  signOut,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
}: DashSidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  // Navigation items with predefined color classes
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className='h-5 w-5' />,
      activePattern: /^\/dashboard$/,
      color: "text-tawakal-green",
      bgActiveClass: "bg-tawakal-green/10 dark:bg-tawakal-green/20",
    },
    {
      name: "Polls",
      href: "/polls",
      icon: <ListChecks className='h-5 w-5' />,
      activePattern: /^\/polls/,
      color: "text-tawakal-blue",
      bgActiveClass: "bg-tawakal-blue/10 dark:bg-tawakal-blue/20",
    },
    {
      name: "Vote History",
      href: "/history",
      icon: <FileText className='h-5 w-5' />,
      activePattern: /^\/history/,
      color: "text-tawakal-gold",
      bgActiveClass: "bg-tawakal-gold/10 dark:bg-tawakal-gold/20",
    },
    {
      name: "Notifications",
      href: "/notifications",
      icon: <Bell className='h-5 w-5' />,
      activePattern: /^\/notifications/,
      color: "text-tawakal-blue",
      bgActiveClass: "bg-tawakal-blue/10 dark:bg-tawakal-blue/20",
    },
    {
      name: "Profile",
      href: "/profile",
      icon: <UserCircle className='h-5 w-5' />,
      activePattern: /^\/profile/,
      color: "text-tawakal-green",
      bgActiveClass: "bg-tawakal-green/10 dark:bg-tawakal-green/20",
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
      bgActiveClass: "bg-tawakal-red/10 dark:bg-tawakal-red/20",
    },
    {
      name: "Poll Analytics",
      href: "/admin/analytics",
      icon: <BarChart3 className='h-5 w-5' />,
      activePattern: /^\/admin\/analytics/,
      color: "text-tawakal-gold",
      bgActiveClass: "bg-tawakal-gold/10 dark:bg-tawakal-gold/20",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: <Settings className='h-5 w-5' />,
      activePattern: /^\/admin\/settings/,
      color: "text-tawakal-blue",
      bgActiveClass: "bg-tawakal-blue/10 dark:bg-tawakal-blue/20",
    },
  ];

  return (
    <>
      <Sidebar
        side='left'
        variant='sidebar'
        collapsible='icon'
        className={cn(
          "w-full md:w-64 z-20 transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
          isMobileMenuOpen ? "block" : "hidden md:block"
        )}
        style={{
          marginTop: "0",
          height: "calc(100vh - 64px)",
        }}>
        <SidebarContent className='pt-4 px-2 overflow-y-auto overflow-x-hidden flex-grow'>
          {/* Create Poll Button */}
          <div className='px-3 py-2'>
            <Drawer>
              <DrawerTrigger asChild>
                <Button className='w-full bg-tawakal-green hover:bg-tawakal-green/90 text-white'>
                  <Plus size={16} className='mr-2' />
                  Create Poll
                </Button>
              </DrawerTrigger>
              <DrawerContent
                className={`${geistMono.className} min-h-[95vh] flex flex-col`}>
                <DrawerHeader className='py-2 flex-shrink-0'>
                  <DrawerTitle className={`text-tawakal-blue text-xl`}>
                    Create New Poll
                  </DrawerTitle>
                  <DrawerDescription className='text-sm'>
                    Add a new poll for users to vote on
                  </DrawerDescription>
                </DrawerHeader>
                <div className='px-4 flex-1 overflow-hidden'>
                  <CreatePollForm
                    onSuccess={() => {
                      const closeButton = document.querySelector(
                        '[data-slot="drawer-close"]'
                      );
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }}
                    userId={user?.id}
                  />
                </div>
                <DrawerClose className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none'>
                  <X className='h-4 w-4' />
                  <span className='sr-only'>Close</span>
                </DrawerClose>
              </DrawerContent>
            </Drawer>
          </div>

          <SidebarGroup>
            <SidebarGroupLabel className='px-3'>General</SidebarGroupLabel>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.activePattern.test(pathname)}
                    tooltip={item.name}
                    className={cn(
                      "transition-colors duration-200",
                      item.activePattern.test(pathname)
                        ? item.bgActiveClass
                        : "hover:bg-muted"
                    )}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}>
                      <span className={item.color}>{item.icon}</span>
                      <span
                        className={
                          item.activePattern.test(pathname) ? "font-medium" : ""
                        }>
                        {item.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          {user?.role === "admin" && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel className='px-3'>
                  Administration
                </SidebarGroupLabel>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={item.activePattern.test(pathname)}
                        tooltip={item.name}
                        className={cn(
                          "transition-colors duration-200",
                          item.activePattern.test(pathname)
                            ? item.bgActiveClass
                            : "hover:bg-muted"
                        )}>
                        <Link
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}>
                          <span className={item.color}>{item.icon}</span>
                          <span
                            className={
                              item.activePattern.test(pathname)
                                ? "font-medium"
                                : ""
                            }>
                            {item.name}
                          </span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </>
          )}
        </SidebarContent>
      </Sidebar>
    </>
  );
}
