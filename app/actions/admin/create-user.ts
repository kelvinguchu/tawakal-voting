"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  role: z.enum(["admin", "user"]),
});

export async function createUser(formData: FormData) {
  const supabase = await createClient();
  const adminClient = createAdminClient();

  // First check if the user making the request is an admin
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) {
    return { error: "Authentication required" };
  }

  // Get the current user's role to verify they're an admin
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("role")
    .eq("id", currentUser.id)
    .single();

  if (userError || userData?.role !== "admin") {
    return { error: "Admin privileges required" };
  }

  try {
    // Parse and validate form data
    const parsed = createUserSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      first_name: formData.get("first_name"),
      last_name: formData.get("last_name"),
      role: formData.get("role"),
    });

    // Create the user with Supabase Auth using admin privileges
    const { data: authData, error: authError } =
      await adminClient.auth.admin.createUser({
        email: parsed.email,
        password: parsed.password,
        email_confirm: true,
        user_metadata: {
          first_name: parsed.first_name,
          last_name: parsed.last_name,
          role: parsed.role,
        },
      });

    if (authError) {
      return { error: authError.message };
    }

    // If successful, insert the record into the users table using the admin client
    // This will bypass RLS policies
    const { error: insertError } = await adminClient.from("users").insert({
      id: authData.user.id,
      email: parsed.email,
      first_name: parsed.first_name,
      last_name: parsed.last_name,
      role: parsed.role,
      is_active: true,
    });

    if (insertError) {
      // If there's an error with the database operation, delete the auth user
      await adminClient.auth.admin.deleteUser(authData.user.id);
      return { error: insertError.message };
    }

    return { success: true, user: authData.user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }
    return { error: "Failed to create user" };
  }
}
