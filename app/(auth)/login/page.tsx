import { LoginForm } from "@/components/forms/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Internal Voting System",
  description: "Login to access the internal voting system",
};

export default function LoginPage() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-4 sm:p-6'>
      <div className='w-full max-w-md text-center mb-8'>
        <h1 className='text-3xl font-bold'>Internal Voting System</h1>
        <p className='text-muted-foreground mt-2'>
          Secure company polls and decisions
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
