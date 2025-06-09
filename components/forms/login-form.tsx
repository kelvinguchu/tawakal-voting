"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { useNavigation } from "@/components/providers/navigation-provider";

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading } = useNavigation();
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

      // Start loading animation before navigation
      startLoading();

      // Force a full page refresh to trigger middleware auth checks
      // This ensures proper handling across server/client boundaries
      window.location.href = "/dashboard";
    } catch (error: any) {
      setError(error.message ?? "Failed to sign in");
      setIsLoading(false);
    }
  }

  return (
    <Card className='w-full bg-white/70 dark:bg-black/40 backdrop-blur-sm border-2 sm:border border-white/20 shadow-lg'>
      <CardHeader className='space-y-1 text-center px-4 sm:px-6 pt-6 sm:pt-8'>
        <h2 className='text-lg sm:text-2xl font-bold'>Sign In</h2>
      </CardHeader>
      <CardContent className='px-4 sm:px-6'>
        {error && (
          <Alert variant='destructive' className='mb-3 sm:mb-4'>
            <AlertCircle className='h-3 w-3 sm:h-4 sm:w-4' />
            <AlertDescription className='text-sm sm:text-base'>
              {error}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-3 sm:space-y-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>Email</FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Mail className='absolute left-2 sm:left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
                      <Input
                        placeholder='Enter your email'
                        type='email'
                        className='pl-8 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className='text-xs sm:text-sm' />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-sm sm:text-base'>
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Lock className='absolute left-2 sm:left-3 top-2.5 sm:top-3 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground' />
                      <Input
                        placeholder='Enter your password'
                        type='password'
                        className='pl-8 sm:pl-10 h-9 sm:h-11 text-sm sm:text-base'
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage className='text-xs sm:text-sm' />
                </FormItem>
              )}
            />
            <Button
              type='submit'
              className='w-full h-9 sm:h-11 text-sm sm:text-base bg-gradient-to-r from-tawakal-green to-tawakal-blue hover:from-tawakal-blue hover:to-tawakal-green transition-all duration-300'
              disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className='hidden sm:inline'>Signing in...</span>
                  <span className='sm:hidden'>Signing in...</span>
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
      <CardFooter className='text-center text-xs sm:text-sm text-muted-foreground px-4 sm:px-6 pb-6 sm:pb-8'>
        Contact admin for access
      </CardFooter>
    </Card>
  );
}
