"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Home, Users, Plus, UserPlus, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AddAccountDialog } from "@/components/admin/add-account-dialog";
import { User } from "@/lib/types/database";
import { cn } from "@/lib/utils";

interface MobileHeaderProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
  user: User | null;
  signOut: () => Promise<void>;
}

export function MobileHeader({
  isMobileMenuOpen,
  toggleMobileMenu,
  user,
  signOut,
}: Readonly<MobileHeaderProps>) {
  const pathname = usePathname();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  // Navigation items matching the sidebar
  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className='h-5 w-5' />,
      activePattern: /^\/dashboard/,
      color: "text-tawakal-green",
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
    },
  ];

  const handleNavClick = () => {
    toggleMobileMenu();
  };

  const handleSignOut = async () => {
    await signOut();
    toggleMobileMenu();
  };

  return (
    <>
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

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={toggleMobileMenu}>
        <SheetContent side='left' className='w-72 p-0'>
          <SheetHeader className='p-4 border-b'>
            <SheetTitle className='text-left bg-gradient-to-r from-tawakal-green to-tawakal-blue bg-clip-text text-transparent'>
              Tawakal Voting
            </SheetTitle>
          </SheetHeader>

          <div className='flex flex-col h-full'>
            <div className='flex-1 py-4'>
              {/* Create Poll Button - Only show for admins */}
              {user?.role === "admin" && (
                <div className='px-4 mb-4'>
                  <Button
                    asChild
                    className='w-full bg-tawakal-green hover:bg-tawakal-green/90 text-white'
                    onClick={handleNavClick}>
                    <Link href='/admin/create-poll'>
                      <Plus size={16} className='mr-2' />
                      Create Poll
                    </Link>
                  </Button>
                </div>
              )}

              {/* Navigation Menu */}
              <div className='px-4 mb-4'>
                <h3 className='text-sm font-medium text-muted-foreground mb-2 px-2'>
                  Menu
                </h3>
                <div className='space-y-1'>
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                        item.activePattern.test(pathname)
                          ? "bg-tawakal-green/10 text-tawakal-green font-medium"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      )}>
                      <span className={item.color}>{item.icon}</span>
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              {/* Admin Section */}
              {user?.role === "admin" && (
                <>
                  <Separator className='mx-4 mb-4' />
                  <div className='px-4'>
                    <h3 className='text-sm font-medium text-muted-foreground mb-2 px-2'>
                      Administration
                    </h3>

                    {/* Add Account Button */}
                    <div className='mb-4'>
                      <Button
                        className='w-full bg-tawakal-green hover:bg-tawakal-green/90 text-white'
                        onClick={() => {
                          setIsAddAccountDialogOpen(true);
                          toggleMobileMenu();
                        }}>
                        <UserPlus size={16} className='mr-2' />
                        Add Account
                      </Button>
                    </div>

                    {/* Admin Navigation */}
                    <div className='space-y-1'>
                      {adminNavItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={handleNavClick}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                            item.activePattern.test(pathname)
                              ? "bg-tawakal-red/10 text-tawakal-red font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted"
                          )}>
                          <span className={item.color}>{item.icon}</span>
                          {item.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Info & Logout */}
            <div className='border-t p-4 mt-auto'>
              {user && (
                <div className='mb-3'>
                  <p className='text-sm font-medium'>
                    {user.first_name} {user.last_name}
                  </p>
                  <p className='text-xs text-muted-foreground'>{user.email}</p>
                  <p className='text-xs text-muted-foreground capitalize'>
                    {user.role}
                  </p>
                </div>
              )}
              <Button
                variant='outline'
                className='w-full text-red-600 hover:text-red-700 hover:bg-red-50'
                onClick={handleSignOut}>
                <LogOut size={16} className='mr-2' />
                Sign Out
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Add Account Dialog */}
      <AddAccountDialog
        open={isAddAccountDialogOpen}
        onOpenChange={setIsAddAccountDialogOpen}
      />
    </>
  );
}
