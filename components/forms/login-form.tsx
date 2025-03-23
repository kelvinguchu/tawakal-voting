"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { loginSchema } from "@/lib/schema/auth";
import { createClient } from "@/lib/supabase/client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Lock, Mail } from "lucide-react";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        throw error;
      }

      // Force a full page refresh to trigger middleware auth checks
      // This ensures proper handling across server/client boundaries
      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
      setIsLoading(false);
    }
  }

  return (
    <Card className='w-full max-w-md mx-auto bg-white/70 dark:bg-black/40 backdrop-blur-sm border border-white/20 shadow-lg'>
      <CardHeader className='space-y-1 text-center'>
        <h2 className='text-2xl font-bold'>Sign In</h2>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant='destructive' className='mb-4'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Mail className='absolute left-3 top-2.5 h-5 w-5 text-muted-foreground' />
                      <Input
                        placeholder='Enter your email'
                        type='email'
                        className='pl-10'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Lock className='absolute left-3 top-2.5 h-5 w-5 text-muted-foreground' />
                      <Input
                        placeholder='Enter your password'
                        type='password'
                        className='pl-10'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full bg-gradient-to-r from-tawakal-green to-tawakal-blue hover:from-tawakal-blue hover:to-tawakal-green transition-all duration-300'
              disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className='text-center text-sm text-muted-foreground'>
        Contact admin for access
      </CardFooter>
    </Card>
  );
}
