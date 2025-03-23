"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types/database";
import { DashSidebar } from "@/components/layout/dash-sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // Fetch the user's role from the database
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (!error && data) {
          setUser(data as User);
        }
      }
    };

    fetchUser();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <html lang='en'>
      <body className='antialiased flex flex-col min-h-screen'>
        {/* Navbar at the top */}
        <Navbar />

        {/* Main content area - starts after the navbar height */}
        <div className='flex flex-col md:flex-row flex-grow bg-gradient-to-br from-white to-slate-100 dark:from-gray-950 dark:to-black pt-16'>
          <div className='absolute inset-x-0 top-16 bottom-0 bg-grid-pattern opacity-5 pointer-events-none'></div>

          {/* Decorative elements */}
          <div className='absolute top-1/3 right-0 w-64 h-64 bg-tawakal-green/5 rounded-full blur-3xl pointer-events-none'></div>
          <div className='absolute bottom-1/3 left-0 w-96 h-96 bg-tawakal-blue/5 rounded-full blur-3xl pointer-events-none'></div>

          <SidebarProvider>
            {/* Mobile header with menu toggle */}
            <MobileHeader
              isMobileMenuOpen={isMobileMenuOpen}
              toggleMobileMenu={toggleMobileMenu}
            />

            {/* Sidebar component */}
            <DashSidebar
              user={user}
              signOut={signOut}
              isMobileMenuOpen={isMobileMenuOpen}
              setIsMobileMenuOpen={setIsMobileMenuOpen}
            />

            {/* Main content */}
            <div className='relative flex-1 overflow-auto'>
              <div className='container py-6 md:py-8 md:pl-6 max-w-full'>
                {children}
              </div>
            </div>
          </SidebarProvider>
        </div>

        {/* Footer at the bottom */}
        <Footer />
      </body>
    </html>
  );
}
