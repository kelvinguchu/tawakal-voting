import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreatePollForm } from "@/components/forms/create-poll-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
    <div className='container mx-auto py-8 space-y-6'>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href='/dashboard'>
              <Home className='h-4 w-4 mr-1' />
              Dashboard
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className='h-4 w-4' />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>
              <PlusCircle className='h-4 w-4 mr-1' />
              Create Poll
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Card className='w-full mx-auto'>
        <CardHeader>
          <CardTitle className='text-tawakal-blue text-2xl'>
            Create New Poll
          </CardTitle>
          <CardDescription>
            Create a new poll for users to vote on
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreatePollForm userId={userData.user.id} userRole={userRole.role} />
        </CardContent>
      </Card>
    </div>
  );
}
