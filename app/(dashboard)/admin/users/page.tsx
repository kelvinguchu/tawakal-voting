import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Metadata } from "next";
import { UserManagementClient } from "@/components/users/user-management-client";

export const metadata: Metadata = {
  title: "User Management - Tawakal Voting System",
  description: "Manage user accounts in the voting system",
};

export default async function UsersPage() {
  const supabase = await createClient();

  // Check if the user is authenticated and is an admin
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData || userData.role !== "admin") {
    redirect("/dashboard");
  }

  // Fetch all users
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (usersError) {
    console.error("Error fetching users:", usersError);
  }

  return (
    <UserManagementClient initialUsers={users || []} currentUserId={user.id} />
  );
}
