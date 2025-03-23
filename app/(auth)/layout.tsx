import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tawakal Express Voting System - Authentication",
  description: "Tawakal Express Voting System",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className='antialiased'>
        <main className='min-h-screen bg-gradient-to-br from-white to-slate-100 dark:from-gray-950 dark:to-black relative'>
          {/* Add decorative elements */}
          <div className='absolute inset-0 bg-grid-pattern opacity-5 pointer-events-none'></div>
          <div className='absolute top-0 right-0 w-1/3 h-1/3 bg-tawakal-green/5 rounded-full blur-3xl pointer-events-none'></div>
          <div className='absolute bottom-0 left-0 w-1/3 h-1/3 bg-tawakal-blue/5 rounded-full blur-3xl pointer-events-none'></div>

          <div className='relative z-10 min-h-screen flex items-center justify-center'>
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
