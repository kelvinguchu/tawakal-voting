"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types/database";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

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
      <body className='antialiased min-h-screen flex flex-col'>
        {/* Navbar at the top */}
        <Navbar />

        <div className='flex min-h-screen flex-col md:flex-row bg-gradient-to-br from-white to-slate-100 dark:from-gray-950 dark:to-black'>
          <div className='absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none'></div>

          {/* Decorative elements */}
          <div className='absolute top-1/4 right-0 w-64 h-64 bg-tawakal-green/5 rounded-full blur-3xl pointer-events-none'></div>
          <div className='absolute bottom-1/4 left-0 w-96 h-96 bg-tawakal-blue/5 rounded-full blur-3xl pointer-events-none'></div>

          {/* Mobile header with menu toggle */}
          <MobileHeader
            isMobileMenuOpen={isMobileMenuOpen}
            toggleMobileMenu={toggleMobileMenu}
          />

          {/* Sidebar component */}
          <Sidebar
            user={user}
            signOut={signOut}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />

          {/* Main content */}
          <div className='relative flex-1 overflow-auto'>
            <div className='container py-6 md:py-8 pt-16'>{children}</div>
          </div>
        </div>

        {/* Footer at the bottom */}
        <Footer />
      </body>
    </html>
  );
}
