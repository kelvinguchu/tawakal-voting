import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Debug log to help troubleshoot
  console.log("Middleware running for path:", request.nextUrl.pathname);

  // Create a response with the pathname header
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add the current pathname as a header for conditional rendering in layouts
  response.headers.set("x-pathname", request.nextUrl.pathname);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Preserve the pathname header
          response.headers.set("x-pathname", request.nextUrl.pathname);
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: "",
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          // Preserve the pathname header
          response.headers.set("x-pathname", request.nextUrl.pathname);
          response.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  console.log("Session exists:", !!session);

  // Fix: More precise auth route pattern matching
  // Check if it's directly /login or in the auth group route
  const isAuthRoute =
    request.nextUrl.pathname === "/login" ||
    request.nextUrl.pathname.startsWith("/login/") ||
    request.nextUrl.pathname.includes("/(auth)") ||
    request.nextUrl.pathname.includes("/auth/");

  console.log("Is auth route:", isAuthRoute);

  // Static assets and API routes that should be accessible without auth
  const isStaticOrApiRoute =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.includes(".") || // For static files
    request.nextUrl.pathname.startsWith("/api/");

  console.log("Is static or API route:", isStaticOrApiRoute);

  // If user is authenticated and visiting the home page, redirect to dashboard
  if (session && request.nextUrl.pathname === "/") {
    console.log("Redirecting authenticated user from home to dashboard");
    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Add cache control header to prevent middleware caching
    redirectResponse.headers.set("x-middleware-cache", "no-cache");
    // Force no store to prevent browser caching
    redirectResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return redirectResponse;
  }

  // Auth check for protected routes
  if (!session && !isAuthRoute && !isStaticOrApiRoute) {
    console.log("Redirecting to login (no session)");
    const redirectUrl = new URL("/login", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Add cache control header to prevent middleware caching
    redirectResponse.headers.set("x-middleware-cache", "no-cache");
    // Force no store to prevent browser caching
    redirectResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return redirectResponse;
  }

  // Redirect logged in users away from auth pages
  if (session && isAuthRoute) {
    console.log("Redirecting to dashboard (has session)");
    const redirectUrl = new URL("/dashboard", request.url);
    const redirectResponse = NextResponse.redirect(redirectUrl);
    // Add cache control header to prevent middleware caching
    redirectResponse.headers.set("x-middleware-cache", "no-cache");
    // Force no store to prevent browser caching
    redirectResponse.headers.set("Cache-Control", "no-store, max-age=0");
    return redirectResponse;
  }

  // Check for admin-only routes
  if (session && request.nextUrl.pathname.includes("/(admin)")) {
    // Fetch user role from database
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (error || userData.role !== "admin") {
      // Not an admin, redirect to user dashboard
      console.log("Redirecting to dashboard (not admin)");
      const redirectUrl = new URL("/dashboard", request.url);
      const redirectResponse = NextResponse.redirect(redirectUrl);
      // Add cache control header to prevent middleware caching
      redirectResponse.headers.set("x-middleware-cache", "no-cache");
      // Force no store to prevent browser caching
      redirectResponse.headers.set("Cache-Control", "no-store, max-age=0");
      return redirectResponse;
    }
  }

  // Add cache control header to all responses to avoid stale redirects
  response.headers.set("x-middleware-cache", "no-cache");
  // Force no store to prevent browser caching
  response.headers.set("Cache-Control", "no-store, max-age=0");

  console.log("Middleware complete, returning response");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
