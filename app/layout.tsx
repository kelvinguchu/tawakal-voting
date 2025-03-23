import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { headers } from "next/headers";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tawakal Express Voting System",
  description: "Tawakal Express Voting System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Get current pathname to determine if we're on an auth page
  const headersList = await headers();
  // Check specific auth-related paths instead of using the header
  const pathname = headersList.get("x-invoke-path") || "";
  const isAuthPage =
    pathname === "/login" ||
    pathname.startsWith("/(auth)") ||
    pathname.includes("/auth/");

  return (
    <html lang='en'>
      <body
        className={`${geistMono.className} antialiased min-h-screen flex flex-col`}>
        {/* Only render Navbar on non-auth pages */}
        {!isAuthPage && <Navbar />}

        {/* Main content with padding for the fixed navbar */}
        <main className={`flex-1 ${!isAuthPage ? "pt-16" : ""}`}>
          {children}
        </main>

        {/* Only render Footer on non-auth pages */}
        {!isAuthPage && <Footer />}
      </body>
    </html>
  );
}
