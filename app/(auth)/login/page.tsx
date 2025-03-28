import { LoginForm } from "@/components/forms/login-form";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Login - Tawakal Voting System",
  description: "Login to access the Tawakal Voting System",
};

export default function LoginPage() {
  return (
    <div className='w-full max-w-md p-4 sm:p-8'>
      <div className='w-full text-center mb-8'>
        <div className='flex justify-center mb-4'>
          <Image
            src='/logo.png'
            alt='Tawakal Express Logo'
            width={180}
            height={180}
            priority
            className='mb-2'
          />
        </div>
        <h1 className='text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tawakal-green via-tawakal-blue to-tawakal-red animate-gradient-x'>
          Tawakal Voting System
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
