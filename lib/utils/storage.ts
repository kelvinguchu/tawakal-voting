import { SupabaseClient } from "@supabase/supabase-js";

const STORAGE_BUCKET = "vote-media";

// Generate a unique file name to avoid collisions
export const generateUniqueFileName = (fileName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const extension = fileName.split(".").pop();
  return `${timestamp}-${randomString}.${extension}`;
};

// Upload a file to Supabase storage
export const uploadFile = async (
  supabase: SupabaseClient,
  file: File,
  path: string = ""
): Promise<string> => {
  const uniqueFileName = generateUniqueFileName(file.name);
  const storagePath = path ? `${path}/${uniqueFileName}` : uniqueFileName;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return data.path;
};

// Get a public URL for a stored file
export const getPublicUrl = (
  supabase: SupabaseClient,
  path: string
): string => {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return data.publicUrl;
};

// Delete a file from storage
export const deleteFile = async (
  supabase: SupabaseClient,
  path: string
): Promise<void> => {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw error;
  }
};

// Upload multiple files and return their paths
export const uploadFiles = async (
  supabase: SupabaseClient,
  files: File[],
  path: string = ""
): Promise<string[]> => {
  const uploadPromises = files.map((file) => uploadFile(supabase, file, path));
  return Promise.all(uploadPromises);
};
