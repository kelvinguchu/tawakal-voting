"use client";

import { useState } from "react";
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
  LogOut,
  ChevronRight,
  Plus,
  UserPlus,
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
import { AddAccountDialog } from "@/components/admin/add-account-dialog";

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
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

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
  ];

  return (
    <>
      <Sidebar
        side='left'
        variant='sidebar'
        collapsible='icon'
        className={cn(
          "w-60 md:w-60 z-20 transition-all duration-300 ease-in-out overflow-hidden flex flex-col",
          isMobileMenuOpen ? "block" : "hidden md:block"
        )}
        style={{
          marginTop: "0",
          height: "calc(100vh - 64px)",
        }}>
        <SidebarContent className='pt-4 px-2 overflow-y-auto overflow-x-hidden flex-grow'>
          {/* Create Poll Button - Only show for admins */}
          {user?.role === "admin" && (
            <div className='px-3 py-2'>
              <Button
                asChild
                className='w-full bg-tawakal-green hover:bg-tawakal-green/90 text-white'>
                <Link href='/admin/create-poll'>
                  <Plus size={16} className='mr-2' />
                  Create Poll
                </Link>
              </Button>
            </div>
          )}

          <SidebarGroup>
            <SidebarGroupLabel className='px-3'>Menu</SidebarGroupLabel>
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

                {/* Add Account Button */}
                <div className='px-3 py-2'>
                  <Button
                    className='w-full bg-tawakal-green hover:bg-tawakal-green/90 text-white'
                    onClick={() => setIsAddAccountDialogOpen(true)}>
                    <UserPlus size={16} className='mr-2' />
                    Add Account
                  </Button>
                </div>

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

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
      />
    </>
  );
}
