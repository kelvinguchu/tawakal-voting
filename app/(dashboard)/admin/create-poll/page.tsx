import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreatePollForm } from "@/components/forms/create-poll-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { LoadingLink } from "@/components/ui/loading-link";
import { ChevronRight, Home, PlusCircle } from "lucide-react";

export default async function CreatePollPage() {
  // Check authentication and authorization
  const supabase = await createClient();

  // Use the more secure getUser method
  const { data: userData, error: authError } = await supabase.auth.getUser();

  if (authError || !userData.user) {
    redirect("/login");
  }

  // Check if user has admin role
  const { data: userRole, error: roleError } = await supabase
    .from("users")
    .select("role")
    .eq("id", userData.user.id)
    .single();

  if (roleError || !userRole || userRole.role !== "admin") {
    // Redirect non-admins to dashboard
    redirect("/dashboard");
  }

  return (
    <div className='container mx-auto px-4 sm:px-6 py-4 sm:py-8 space-y-4 sm:space-y-6'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <LoadingLink href='/dashboard' className='flex items-center'>
                <Home className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
                <span className='hidden sm:inline'>Dashboard</span>
                <span className='sm:hidden'>Home</span>
              </LoadingLink>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className='h-3 w-3 sm:h-4 sm:w-4' />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage className='flex items-center'>
              <PlusCircle className='h-3 w-3 sm:h-4 sm:w-4 mr-1' />
              <span className='hidden sm:inline'>Create Poll</span>
              <span className='sm:hidden'>Create</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className='space-y-4 sm:space-y-6'>
        <div>
          <h1 className='text-tawakal-blue text-xl sm:text-2xl font-semibold'>
            Create New Poll
          </h1>
          <p className='text-muted-foreground text-sm sm:text-base mt-1'>
            Create a new poll for users to vote on
          </p>
        </div>

        <CreatePollForm userId={userData.user.id} userRole={userRole.role} />
      </div>
    </div>
  );
}
