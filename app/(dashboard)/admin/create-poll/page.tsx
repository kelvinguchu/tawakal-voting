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
  const supabase = await createClient();

  // Get the user session and authenticate it
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Redirect if not authenticated
  if (!session) {
    redirect("/login");
  }

  // Verify the user with a secure method
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Double-check authentication
  if (!user) {
    redirect("/login");
  }

  // Get the user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Redirect if not an admin
  if (userData?.role !== "admin") {
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
          <CreatePollForm userId={userData.id} userRole={userData.role} />
        </CardContent>
      </Card>
    </div>
  );
}
