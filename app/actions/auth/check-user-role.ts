"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Checks if the current user is authenticated and returns their details
 * @returns Object containing user data or redirects to login if not authenticated
 */
export async function requireAuth() {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (userError || !userData) {
    redirect("/login");
  }

  return { user, userData };
}

/**
 * Checks if the current user is an admin and returns their details
 * Redirects to dashboard if the user is not an admin
 * @returns Object containing user data or redirects if not admin
 */
export async function requireAdmin() {
  const { user, userData } = await requireAuth();

  // Check if user is admin
  if (userData.role !== "admin") {
    redirect("/dashboard");
  }

  return { user, userData };
}

/**
 * Checks if the current user has a specific role without redirecting
 * @param role The role to check for
 * @returns Boolean indicating if user has the requested role
 */
export async function hasRole(role: "admin" | "user") {
  try {
    const supabase = await createClient();

    // Check if the user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return false;
    }

    // Fetch user data
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userError || !userData) {
      return false;
    }

    return userData.role === role;
  } catch (error) {
    console.error("Error checking user role:", error);
    return false;
  }
}
