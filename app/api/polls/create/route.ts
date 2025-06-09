import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {

    // Create Supabase client with server context
    const supabase = await createClient();

    // Use the more secure method to get authenticated user
    const { data: userData, error: authError } = await supabase.auth.getUser();

    if (authError || !userData.user) {
      return NextResponse.json(
        { message: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    const user = userData.user;

    // Parse request body first to get information
    const requestData = await request.json();
    const {
      title,
      description,
      start_time,
      end_time,
      created_by,
      validOptions,
      status,
      mediaItems,
    } = requestData;

    // Log the request for debugging
    console.log("API received poll data:", {
      title,
      description: description || "",
      created_by,
      validOptions: validOptions?.length || 0,
    });

    // Get user data to verify admin role
    const { data: userDbData, error: userDbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (userDbError) {
      console.error("Error fetching user data:", userDbError);
      return NextResponse.json(
        {
          message: `Unauthorized: Failed to fetch user data: ${userDbError.message}`,
        },
        { status: 401 }
      );
    }

    if (!userDbData) {
      console.error("No user data found");
      return NextResponse.json(
        { message: "Unauthorized: User data not found" },
        { status: 401 }
      );
    }

    console.log("User role from database:", userDbData.role);

    if (userDbData.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can create polls" },
        { status: 403 }
      );
    }

    // Validate required fields
    if (
      !title ||
      !start_time ||
      !end_time ||
      !created_by ||
      !validOptions ||
      validOptions.length < 2
    ) {
      return NextResponse.json(
        {
          message: "Bad Request: Missing required fields or not enough options",
        },
        { status: 400 }
      );
    }

    try {
      console.log("Attempting to create poll with user role:", userDbData.role);

      // 1. Create poll as draft
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title,
          description: description ?? "",
          start_time,
          end_time,
          created_by,
          status: "draft", // Always create as draft initially
        })
        .select()
        .single();

      if (pollError) {
        console.error("Error creating poll:", pollError);

        // If we still get an RLS violation, provide helpful error
        if (pollError.code === "42501") {
          console.error(
            "RLS policy violation. Session user:",
            user.id,
            "Database user role:",
            userDbData.role
          );
          console.error(
            "Make sure the is_admin() function is working properly"
          );

          return NextResponse.json(
            {
              message: `RLS error: The current user doesn't have permission to create polls.`,
              details:
                "Please check that the is_admin() function is working properly.",
            },
            { status: 500 }
          );
        }

        return NextResponse.json(
          { message: `Failed to create poll: ${pollError.message}` },
          { status: 500 }
        );
      }

      console.log("Poll created successfully, ID:", poll.id);

      // 2. Add poll options
      for (const option of validOptions) {
        const { data: optionData, error: optionError } = await supabase
          .from("poll_options")
          .insert({
            poll_id: poll.id,
            option_text: option.text.trim(),
          })
          .select()
          .single();

        if (optionError) {
          console.error("Error creating option:", optionError);
          return NextResponse.json(
            { message: `Failed to create poll option: ${optionError.message}` },
            { status: 500 }
          );
        }
      }

      // 3. Handle media attachments (links only for now)
      if (mediaItems && mediaItems.length > 0) {
        for (const item of mediaItems) {
          if (item.type === "link" && item.url) {
            const { error: mediaError } = await supabase
              .from("poll_media")
              .insert({
                poll_id: poll.id,
                media_type: "link",
                media_url: item.url,
                description: item.description ?? null,
              });

            if (mediaError) {
              console.error("Error adding media link:", mediaError);
            }
          } else if (item.type === "document" && item.url) {
            // Handle document links (like Google Docs)
            const { error: mediaError } = await supabase
              .from("poll_media")
              .insert({
                poll_id: poll.id,
                media_type: "document",
                media_url: item.url,
                description: item.description ?? null,
              });

            if (mediaError) {
              console.error("Error adding document link:", mediaError);
            }
          }
        }
      }

      // 4. Update poll status to the desired status
      const { error: updateError } = await supabase
        .from("polls")
        .update({ status })
        .eq("id", poll.id);

      if (updateError) {
        console.error("Error updating poll status:", updateError);
        return NextResponse.json(
          { message: `Failed to update poll status: ${updateError.message}` },
          { status: 500 }
        );
      }

      console.log("Poll creation completed successfully");

      // Return success response
      return NextResponse.json({
        message: "Poll created successfully",
        pollId: poll.id,
      });
    } catch (dbError) {
      console.error("Database operation error:", dbError);
      return NextResponse.json(
        {
          message: `Database error: ${
            dbError instanceof Error ? dbError.message : "Unknown error"
          }`,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Unexpected error in API route:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
