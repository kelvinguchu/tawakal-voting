import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Get the authenticated user with the more secure method
    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData.user) {
      return NextResponse.json(
        { message: "Unauthorized: You must be logged in" },
        { status: 401 }
      );
    }

    // Verify admin role
    const { data: userDbData, error: userDbError } = await supabase
      .from("users")
      .select("role")
      .eq("id", userData.user.id)
      .single();

    if (userDbError || !userDbData || userDbData.role !== "admin") {
      return NextResponse.json(
        { message: "Forbidden: Only administrators can upload files" },
        { status: 403 }
      );
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
      const { error: mediaError } = await supabase.from("option_media").insert({
        option_id: optionId,
        media_type: "image", // Option media is always image
        storage_path: storagePath,
        description,
      });

      if (mediaError) {
        console.error("Error adding option media:", mediaError);
        // If database entry fails, delete the uploaded file
        await supabase.storage.from("vote-media").remove([storagePath]);
        return NextResponse.json(
          {
            message: `Failed to create media record: ${mediaError.message}`,
          },
          { status: 500 }
        );
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
      const { error: mediaError } = await supabase.from("poll_media").insert({
        poll_id: pollId,
        media_type: mediaType,
        storage_path: storagePath,
        description,
      });

      if (mediaError) {
        console.error("Error adding poll media:", mediaError);
        // If database entry fails, delete the uploaded file
        await supabase.storage.from("vote-media").remove([storagePath]);
        return NextResponse.json(
          {
            message: `Failed to create media record: ${mediaError.message}`,
          },
          { status: 500 }
        );
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
    const { data: publicUrlData } = await supabase.storage
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
