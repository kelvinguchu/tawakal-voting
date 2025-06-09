import "./globals.css";
import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { NavigationProvider } from "@/components/providers/navigation-provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tawakal Express Voting System",
  description: "Tawakal Express Voting System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${geistMono.className} antialiased`}>
        <NavigationProvider>{children}</NavigationProvider>
      </body>
    </html>
  );
}
