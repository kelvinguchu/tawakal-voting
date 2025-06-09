"use client";

import { useState } from "react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { LoadingLink } from "@/components/ui/loading-link";
import { Button } from "@/components/ui/button";
import {
  Menu,
  ChevronDown,
  LogOut,
  User,
  Home,
  Users,
  Plus,
  UserPlus,
} from "lucide-react";
import { User as UserType } from "@/lib/types/database";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AddAccountDialog } from "@/components/admin/add-account-dialog";
import { cn } from "@/lib/utils";

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
}: Readonly<NavbarProps>) {
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
    setIsMobileMenuOpen(false);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsMobileMenuOpen(false);
  };
  return (
    <>
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

            <LoadingLink
              href='/dashboard'
              className='flex items-center space-x-2'>
              <Image
                src='/logo.png'
                alt='Tawakal Express Logo'
                width={100}
                height={100}
              />
            </LoadingLink>
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
                  <LoadingLink href='/profile' className='cursor-pointer'>
                    <User className='h-4 w-4 mr-2' />
                    <span>Profile</span>
                  </LoadingLink>
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

      {/* Mobile Navigation Sheet */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
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
                    <LoadingLink href='/admin/create-poll'>
                      <Plus size={16} className='mr-2' />
                      Create Poll
                    </LoadingLink>
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
                    <LoadingLink
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
                    </LoadingLink>
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
                          setIsMobileMenuOpen(false);
                        }}>
                        <UserPlus size={16} className='mr-2' />
                        Add Account
                      </Button>
                    </div>

                    {/* Admin Navigation */}
                    <div className='space-y-1'>
                      {adminNavItems.map((item) => (
                        <LoadingLink
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
                        </LoadingLink>
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
