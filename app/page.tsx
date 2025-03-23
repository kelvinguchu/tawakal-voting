import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  // Check if user is authenticated
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If authenticated, redirect to dashboard, otherwise to login
  if (session) {
    redirect("/dashboard");
  }

  // For non-authenticated users, redirect to login
  redirect("/login");

  // We won't actually render anything on this page
  return null;
}
