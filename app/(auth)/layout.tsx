export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className='flex min-h-screen bg-gradient-to-b from-background to-secondary/10'>
      {children}
    </main>
  );
}
