"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { User } from "@/lib/types/database";
import { MobileHeader } from "@/components/layout/mobile-header";
import { DashSidebar } from "@/components/layout/dash-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function getUser() {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        console.error("Authentication error:", authError);
        window.location.href = "/login";
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (userError || !userData) {
        console.error("User data error:", userError);
        window.location.href = "/login";
        return;
      }

      setUser(userData);
    }

    getUser();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = "/login";
    } else {
      console.error("Sign out error:", error);
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SidebarProvider>
      <div className='flex flex-col h-screen w-full'>
        <Navbar
          user={user}
          signOut={signOut}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className='flex flex-grow mt-16 w-full'>
          <DashSidebar
            user={user}
            signOut={signOut}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className='flex-1 overflow-y-auto p-4 md:p-6 w-full max-w-full'>
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
