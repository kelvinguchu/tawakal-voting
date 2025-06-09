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
      <div className='w-full text-center mb-6 sm:mb-8'>
        <div className='flex justify-center mb-3 sm:mb-4'>
          <Image
            src='/logo-vertical.png'
            alt='Tawakal Express Logo'
            width={200}
            height={200}
            priority
            className='mb-2 w-[140px] h-[80px] sm:w-[200px] sm:h-[100px]'
          />
        </div>
        <h1 className='text-2xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-tawakal-green via-tawakal-blue to-tawakal-red animate-gradient-x px-2'>
          Tawakal Voting System
        </h1>
      </div>
      <LoginForm />
    </div>
  );
}
