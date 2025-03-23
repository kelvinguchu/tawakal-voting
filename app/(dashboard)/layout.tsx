"use client";

import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
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
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data: userData } = await supabase
        .from("users")
        .select("*")
        .eq("id", session.user.id)
        .single();

      setUser(userData);
    }

    getUser();
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) {
      window.location.href = "/login";
    }
  };

  // Toggle mobile menu
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <SidebarProvider>
      <div className='flex flex-col h-screen'>
        <Navbar
          user={user}
          signOut={signOut}
          isMobileMenuOpen={isMobileMenuOpen}
          setIsMobileMenuOpen={setIsMobileMenuOpen}
        />

        <div className='flex flex-grow mt-16'>
          <DashSidebar
            user={user}
            signOut={signOut}
            isMobileMenuOpen={isMobileMenuOpen}
            setIsMobileMenuOpen={setIsMobileMenuOpen}
          />
          <main className='flex-1 overflow-y-auto p-4 md:p-6'>{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
