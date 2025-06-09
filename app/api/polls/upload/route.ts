import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user with the more secure method
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      console.error("User authentication error:", userError);
      return NextResponse.json(
        { message: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    console.log("Authenticated user ID:", userData.user.id);

    // Verify admin role
    const { data: userDbData, error: userDbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (userDbError) {
      console.error("Error fetching user role from database:", userDbError);
      return NextResponse.json(
        { message: "Database error: Could not verify user role" },
        { status: 500 }
      );
    }

    if (!userDbData || userDbData.role !== "admin") {
      console.error("User role verification failed:", { userDbData });
      return NextResponse.json(
        { message: "Forbidden: Only administrators can upload files" },
        { status: 403 }
      );
    }

    console.log("User role verified as admin:", userDbData.role);

    // Test RLS policy by checking if we can query the users table
    try {
      const { data: rlsTest, error: rlsError } = await supabase
        .from("users")
        .select("id, role")
        .eq("id", userData.user.id)
        .single();

      if (rlsError) {
        console.error("RLS test failed - cannot query users table:", rlsError);
      } else {
        console.log("RLS test passed - can query users table:", rlsTest);
      }
    } catch (error) {
      console.error("RLS test exception:", error);
    }

    // Handle file upload - Parse the multipart form data
    const formData = await request.formData();

    // Extract file from the formData
    const file = formData.get("file") as File;
    const pollId = formData.get("pollId") as string;
    const optionId = formData.get("optionId") as string;
    const mediaType = formData.get("mediaType") as string;
    const description = (formData.get("description") as string) || null;

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        {
          message: "No file provided or invalid file",
        },
        { status: 400 }
      );
    }

    if (!mediaType || !["image", "document"].includes(mediaType)) {
      return NextResponse.json(
        {
          message: "Invalid media type. Must be 'image' or 'document'",
        },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split(".").pop();
    const fileName = `${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 15)}.${fileExtension}`;

    // Create the path based on the upload type
    let storagePath;
    let uploadResult;

    if (optionId) {
      // This is an option image upload
      storagePath = `option-images/${optionId}/${fileName}`;

      // Upload the file to Supabase Storage
      uploadResult = await supabase.storage
        .from("vote-media")
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        console.error("Storage upload error:", uploadResult.error);
        return NextResponse.json(
          {
            message: `Failed to upload file: ${uploadResult.error.message}`,
          },
          { status: 500 }
        );
      }

      // Add entry to option_media table
      console.log("Attempting to insert option_media:", {
        option_id: optionId,
        media_type: "image",
        storage_path: storagePath,
        description,
        user_id: userData.user.id,
      });

      const { error: mediaError } = await supabase.from("option_media").insert({
        option_id: optionId,
        media_type: "image", // Option media is always image
        storage_path: storagePath,
        description,
      });

      if (mediaError) {
        console.error("Error adding option media:", mediaError);
        console.error(
          "Full error details:",
          JSON.stringify(mediaError, null, 2)
        );

        // If database entry fails, delete the uploaded file
        await supabase.storage.from("vote-media").remove([storagePath]);

        // Provide more specific error message based on error type
        let errorMessage = `Failed to create media record: ${mediaError.message}`;
        if (mediaError.message?.includes("row-level security policy")) {
          errorMessage = `Database permission error: Unable to save file information. Please contact support.`;
        }

        return NextResponse.json({ message: errorMessage }, { status: 500 });
      }
    } else if (pollId) {
      // This is a poll media upload
      storagePath = `poll-attachments/${pollId}/${fileName}`;

      // Upload the file to Supabase Storage
      uploadResult = await supabase.storage
        .from("vote-media")
        .upload(storagePath, file, {
          contentType: file.type,
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadResult.error) {
        console.error("Storage upload error:", uploadResult.error);
        return NextResponse.json(
          {
            message: `Failed to upload file: ${uploadResult.error.message}`,
          },
          { status: 500 }
        );
      }

      // Add entry to poll_media table
      console.log("Attempting to insert poll_media:", {
        poll_id: pollId,
        media_type: mediaType,
        storage_path: storagePath,
        description,
        user_id: userData.user.id,
      });

      const { error: mediaError } = await supabase.from("poll_media").insert({
        poll_id: pollId,
        media_type: mediaType,
        storage_path: storagePath,
        description,
      });

      if (mediaError) {
        console.error("Error adding poll media:", mediaError);
        console.error(
          "Full error details:",
          JSON.stringify(mediaError, null, 2)
        );

        // If database entry fails, delete the uploaded file
        await supabase.storage.from("vote-media").remove([storagePath]);

        // Provide more specific error message based on error type
        let errorMessage = `Failed to create media record: ${mediaError.message}`;
        if (mediaError.message?.includes("row-level security policy")) {
          errorMessage = `Database permission error: Unable to save file information. Please contact support.`;
        }

        return NextResponse.json({ message: errorMessage }, { status: 500 });
      }
    } else {
      return NextResponse.json(
        {
          message: "Either pollId or optionId must be provided",
        },
        { status: 400 }
      );
    }

    // Generate a public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from("vote-media")
      .getPublicUrl(storagePath);

    return NextResponse.json({
      message: "File uploaded successfully",
      filePath: storagePath,
      publicUrl: publicUrlData.publicUrl,
      success: true,
    });
  } catch (error) {
    console.error("Error in upload API route:", error);
    return NextResponse.json(
      { message: "An error occurred processing the upload" },
      { status: 500 }
    );
  }
}
