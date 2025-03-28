"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  CalendarIcon,
  Clock,
  Link as LinkIcon,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { addHours } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const formSchema = z.object({
  title: z.string().min(3, {
    message: "Title must be at least 3 characters.",
  }),
  description: z.string().optional().default(""),
  status: z.enum(["scheduled", "active"]),
  startDate: z.date({
    required_error: "Start date is required.",
  }),
  startTime: z.string({
    required_error: "Start time is required.",
  }),
  duration: z
    .number({
      required_error: "Duration is required.",
    })
    .min(1, {
      message: "Duration must be at least 1 hour.",
    }),
  options: z
    .array(
      z.object({
        text: z.string().min(1, "Option text is required"),
        image: z.instanceof(File).optional(),
        imageDescription: z.string().optional(),
      })
    )
    .min(2, {
      message: "At least 2 options are required.",
    }),
  media: z
    .array(
      z.object({
        type: z.enum(["image", "document", "link"]),
        url: z.string().optional(),
        file: z.instanceof(File).optional(),
        description: z.string().optional(),
      })
    )
    .optional()
    .default([]),
});

interface CreatePollFormProps {
  onSuccess?: () => void;
  userId?: string;
  userRole?: string;
}

export function CreatePollForm({
  onSuccess,
  userId,
  userRole,
}: CreatePollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaTab, setMediaTab] = useState<string>("link");
  const [documentInputType, setDocumentInputType] = useState<"upload" | "link">(
    "link"
  );
  const [startImmediately, setStartImmediately] = useState(false);
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "scheduled",
      startTime: "12:00",
      duration: 5,
      options: [
        { text: "", image: undefined, imageDescription: "" },
        { text: "", image: undefined, imageDescription: "" },
      ],
      media: [],
    },
  });

  const addOption = () => {
    const options = form.getValues("options");
    form.setValue("options", [
      ...options,
      { text: "", image: undefined, imageDescription: "" },
    ]);
  };

  const removeOption = (index: number) => {
    const options = form.getValues("options");
    if (options.length <= 2) return;
    form.setValue(
      "options",
      options.filter((_, i) => i !== index)
    );
  };

  // Handle option image upload
  const handleOptionImageChange = (
    index: number,
    file: File | undefined,
    description: string = ""
  ) => {
    console.log(
      `Option image change for index ${index}:`,
      file ? file.name : "No file"
    );
    const options = [...form.getValues("options")];
    if (options[index]) {
      options[index] = {
        ...options[index],
        image: file,
        imageDescription: description,
      };
      console.log(`Updated option ${index}:`, {
        text: options[index].text,
        hasImage: !!options[index].image,
        imageDescription: options[index].imageDescription,
      });
      form.setValue("options", options);
    }
  };

  const addMedia = (
    type: "image" | "document" | "link",
    data: { url?: string; file?: File; description?: string }
  ) => {
    const media = form.getValues("media") || [];
    form.setValue("media", [...media, { type, ...data }]);
  };

  const removeMedia = (index: number) => {
    const media = form.getValues("media") || [];
    form.setValue(
      "media",
      media.filter((_, i) => i !== index)
    );
  };

  const calculateEndTime = (
    startDate: Date,
    startTime: string,
    durationHours: number
  ) => {
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDateTime = new Date(startDate);
    startDateTime.setHours(hours, minutes, 0, 0);
    return addHours(startDateTime, durationHours);
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!userId) {
      toast.error("You must be logged in to create a poll");
      return;
    }

    // Check if user is admin
    if (userRole !== "admin") {
      toast.error("Only administrators can create polls");
      return;
    }

    // Console logs to debug what's being submitted
    console.log("Submitting form with values:", {
      title: values.title,
      description: values.description || "",
      status: values.status,
      startDate: values.startDate,
      startTime: values.startTime,
      duration: values.duration,
      optionsCount: values.options.length,
      mediaCount: values.media?.length || 0,
      startImmediately,
    });
    console.log("User ID:", userId);
    console.log("User role:", userRole);

    // Check for file attachments (options with images and media items with files)
    const optionsWithImages = values.options.filter(
      (opt) => opt.image instanceof File
    );
    const mediaWithFiles = (values.media || []).filter(
      (item) => item.file instanceof File
    );

    console.log("Options with images:", optionsWithImages.length);
    if (optionsWithImages.length > 0) {
      optionsWithImages.forEach((opt, idx) => {
        console.log(`Option image ${idx}:`, {
          filename: opt.image?.name,
          size: opt.image?.size,
          type: opt.image?.type,
        });
      });
    }

    console.log("Media items with files:", mediaWithFiles.length);
    if (mediaWithFiles.length > 0) {
      mediaWithFiles.forEach((item, idx) => {
        console.log(`Media file ${idx}:`, {
          type: item.type,
          filename: item.file?.name,
          size: item.file?.size,
          fileType: item.file?.type,
        });
      });
    }

    // Ensure we have at least 2 valid options
    const validOptions = values.options.filter(
      (option) => option.text.trim().length > 0
    );
    console.log("Valid options count:", validOptions.length);
    console.log("Valid options:", validOptions);

    if (validOptions.length < 2) {
      toast.error("You must provide at least 2 valid options");
      return;
    }

    setIsSubmitting(true);

    try {
      let startDateTime = new Date(values.startDate);

      // If starting immediately, use current time
      if (startImmediately) {
        startDateTime = new Date(); // Current time
      } else {
        // Otherwise use the selected date and time
        const [hours, minutes] = values.startTime.split(":").map(Number);
        startDateTime.setHours(hours, minutes, 0, 0);
      }

      // Calculate end time directly using the start date/time with the duration
      const endDateTime = addHours(startDateTime, values.duration);

      // Status is determined by the Start immediately checkbox
      // This should already be set correctly in the form values
      console.log("Poll data to insert:", {
        title: values.title,
        description: values.description || "",
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        created_by: userId,
        status: values.status,
        starts_immediately: startImmediately,
      });

      // Use server-side API to create the poll
      const response = await fetch("/api/polls/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || "",
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          created_by: userId,
          validOptions: validOptions.map((opt) => ({ text: opt.text })), // Only send the text for now, we'll upload images separately
          status: values.status,
          mediaItems: values.media
            .filter(
              (item) =>
                item.type === "link" || (item.type === "document" && item.url)
            ) // Only include links here
            .map((item) => ({
              type: item.type,
              url: item.url,
              description: item.description || "",
            })),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error:", errorData);
        throw new Error(errorData.message || "Failed to create poll");
      }

      const { pollId } = await response.json();
      console.log("Poll created successfully with ID:", pollId);

      // Now handle file uploads for options with images
      const optionUploadPromises = [];

      // First, upload option images
      for (let i = 0; i < validOptions.length; i++) {
        const option = validOptions[i];
        if (option.image instanceof File) {
          console.log(`Preparing to upload option image for option #${i + 1}`);

          // Get the option ID - we need to find it from the backend since it was just created
          const { data: optionData } = await supabase
            .from("poll_options")
            .select("id")
            .eq("poll_id", pollId)
            .eq("option_text", option.text)
            .single();

          if (!optionData?.id) {
            console.error(
              `Could not find option ID for option: ${option.text}`
            );
            continue;
          }

          console.log(
            `Found option ID: ${optionData.id} for option text: ${option.text}`
          );

          // Upload the image file
          const formData = new FormData();
          formData.append("file", option.image);
          formData.append("optionId", optionData.id);
          formData.append("mediaType", "image");
          if (option.imageDescription) {
            formData.append("description", option.imageDescription);
          }

          const uploadPromise = fetch("/api/polls/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => {
              if (!res.ok) {
                console.error(
                  `Failed to upload image for option ${option.text}`
                );
                return res.json().then((data) => Promise.reject(data));
              }
              return res.json();
            })
            .then((data) => {
              console.log(
                `Successfully uploaded option image: ${data.filePath}`
              );
              return data;
            })
            .catch((err) => {
              console.error("Option image upload error:", err);
              return null;
            });

          optionUploadPromises.push(uploadPromise);
        }
      }

      // Now handle file uploads for poll media attachments
      const mediaUploadPromises = [];
      for (const mediaItem of values.media || []) {
        if (mediaItem.file instanceof File) {
          console.log(`Preparing to upload poll media: ${mediaItem.file.name}`);

          const formData = new FormData();
          formData.append("file", mediaItem.file);
          formData.append("pollId", pollId);
          formData.append("mediaType", mediaItem.type);
          if (mediaItem.description) {
            formData.append("description", mediaItem.description);
          }

          const uploadPromise = fetch("/api/polls/upload", {
            method: "POST",
            body: formData,
          })
            .then((res) => {
              if (!res.ok) {
                console.error(`Failed to upload media ${mediaItem.file?.name}`);
                return res.json().then((data) => Promise.reject(data));
              }
              return res.json();
            })
            .then((data) => {
              console.log(`Successfully uploaded poll media: ${data.filePath}`);
              return data;
            })
            .catch((err) => {
              console.error("Poll media upload error:", err);
              return null;
            });

          mediaUploadPromises.push(uploadPromise);
        }
      }

      // Wait for all uploads to complete
      await Promise.allSettled([
        ...optionUploadPromises,
        ...mediaUploadPromises,
      ]);

      toast.success("Poll created successfully!");
      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to polls page if no onSuccess handler
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      // Provide more detailed error message based on the error
      if (error && typeof error === "object" && "message" in error) {
        const errorMessage = (error as any).message;
        if (errorMessage.includes("at least 2 options")) {
          toast.error(
            "Poll creation failed: You must have at least 2 options for an active poll."
          );
        } else {
          toast.error(`Failed to create poll: ${errorMessage}`);
        }
      } else {
        toast.error("Failed to create poll. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col space-y-8'>
        <div className='space-y-6'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700 font-medium'>
                  Poll Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter a question or title'
                    {...field}
                    className='border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-gray-700 font-medium'>
                  Description{" "}
                  <span className='text-muted-foreground text-xs'>
                    (optional)
                  </span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Provide more details about this poll'
                    className='min-h-[100px] border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='status'
            render={({ field }) => (
              <FormItem className='mb-2'>
                <div className='flex items-center gap-2 mb-1'>
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full",
                      field.value === "active" ? "bg-green-500" : "bg-blue-500"
                    )}
                  />
                  <span className='text-sm font-medium text-gray-700'>
                    {field.value === "active"
                      ? "Poll will start immediately"
                      : "Poll will start at scheduled time"}
                  </span>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 md:grid-cols-12 gap-6'>
            <div className='md:col-span-5'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel className='text-gray-700 font-medium'>
                      Start Date
                    </FormLabel>
                    <div className='space-y-4'>
                      <div className='flex items-center'>
                        <input
                          type='checkbox'
                          id='startImmediately'
                          checked={startImmediately}
                          onChange={(e) => {
                            setStartImmediately(e.target.checked);
                            if (e.target.checked) {
                              // When checked, set start date to now
                              field.onChange(new Date());
                              // Set status to active
                              form.setValue("status", "active");
                            } else {
                              // When unchecked, set status back to scheduled
                              form.setValue("status", "scheduled");
                            }
                          }}
                          className='h-4 w-4 rounded border-tawakal-blue/30 text-tawakal-blue focus:ring-tawakal-blue'
                        />
                        <label
                          htmlFor='startImmediately'
                          className='ml-2 text-sm font-medium text-gray-700'>
                          Start poll immediately
                        </label>
                      </div>

                      {!startImmediately && (
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant='outline'
                                className={cn(
                                  "w-full pl-3 text-left font-normal border border-gray-300 bg-white hover:bg-gray-50",
                                  !field.value && "text-muted-foreground"
                                )}>
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-70' />
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) => date < new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='md:col-span-3'>
              <FormField
                control={form.control}
                name='startTime'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700 font-medium'>
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type='time'
                          {...field}
                          disabled={startImmediately}
                          className={cn(
                            "pl-9 border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue",
                            startImmediately && "opacity-50 bg-gray-50"
                          )}
                        />
                        <Clock className='absolute left-3 top-2.5 h-4 w-4 text-gray-500' />
                      </div>
                    </FormControl>
                    {startImmediately && (
                      <p className='text-xs text-gray-500 mt-1'>
                        Current time will be used
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='md:col-span-4'>
              <FormField
                control={form.control}
                name='duration'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='text-gray-700 font-medium'>
                      Duration (hours)
                    </FormLabel>
                    <FormControl>
                      <div className='flex items-center'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-10 w-10 rounded-r-none border-gray-300 text-gray-700'
                          onClick={() => {
                            const currentValue = field.value || 1;
                            if (currentValue > 1) {
                              field.onChange(currentValue - 1);
                            }
                          }}>
                          -
                        </Button>
                        <Input
                          type='number'
                          min={1}
                          className='h-10 text-center rounded-none border-x-0 border-gray-300'
                          {...field}
                          onChange={(e) => {
                            const value = parseInt(e.target.value);
                            if (!isNaN(value) && value > 0) {
                              field.onChange(value);
                            }
                          }}
                        />
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          className='h-10 w-10 rounded-l-none border-gray-300 text-gray-700'
                          onClick={() => {
                            const currentValue = field.value || 0;
                            field.onChange(currentValue + 1);
                          }}>
                          +
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className='pt-4 border-t'>
            <div className='flex justify-between items-center mb-4'>
              <FormLabel className='text-gray-700 font-medium text-base m-0'>
                Poll Options
              </FormLabel>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addOption}
                className='flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-gray-700'>
                <Plus className='h-4 w-4' />
                <span>Add Option</span>
              </Button>
            </div>

            <div className='space-y-4'>
              {form.watch("options").map((option, index) => (
                <div
                  key={index}
                  className='space-y-3 p-4 border rounded-md bg-gray-50'>
                  <div className='flex gap-2'>
                    <FormField
                      control={form.control}
                      name={`options.${index}.text`}
                      render={({ field }) => (
                        <FormItem className='flex-1'>
                          <FormControl>
                            <Input
                              placeholder={`Option ${index + 1}`}
                              {...field}
                              className='border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => removeOption(index)}
                      disabled={form.watch("options").length <= 2}
                      className='text-gray-500 hover:text-red-500 hover:bg-red-50'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>

                  {/* Option image upload */}
                  <div className='flex gap-2'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-1'>
                        <span className='text-xs text-gray-500 font-medium'>
                          Image (optional)
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <Input
                          type='file'
                          accept='image/*'
                          id={`option-image-${index}`}
                          className='flex-1 text-xs border-gray-300'
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            handleOptionImageChange(
                              index,
                              file,
                              form.getValues(
                                `options.${index}.imageDescription`
                              ) || ""
                            );
                          }}
                        />
                        <Input
                          placeholder='Image description'
                          value={option.imageDescription || ""}
                          onChange={(e) => {
                            handleOptionImageChange(
                              index,
                              option.image,
                              e.target.value
                            );
                          }}
                          className='flex-1 text-xs border-gray-300'
                        />
                      </div>
                      {option.image && (
                        <div className='flex items-center mt-1 text-xs text-green-600'>
                          <Upload className='h-3 w-3 mr-1' />
                          <span className='truncate'>{option.image.name}</span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='ml-auto h-5 w-5 p-0 text-gray-400 hover:text-red-400'
                            onClick={() =>
                              handleOptionImageChange(index, undefined, "")
                            }>
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.options?.message && (
              <p className='text-sm font-medium text-destructive mt-2'>
                {form.formState.errors.options?.message}
              </p>
            )}
          </div>

          {/* Media Attachments Section */}
          <div className='border border-gray-300 rounded-md p-5 bg-gray-50 mt-8'>
            <div className='flex justify-between items-center mb-4'>
              <FormLabel className='text-gray-700 font-medium text-base m-0'>
                Media Attachments (Optional)
              </FormLabel>
            </div>

            <Tabs value={mediaTab} onValueChange={setMediaTab}>
              <TabsList className='grid w-full grid-cols-3 mb-4 bg-white border'>
                <TabsTrigger
                  value='link'
                  className='data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
                  Link
                </TabsTrigger>
                <TabsTrigger
                  value='image'
                  className='data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value='document'
                  className='data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
                  Document
                </TabsTrigger>
              </TabsList>

              <TabsContent value='link'>
                <div className='flex gap-2 mb-4'>
                  <Input
                    placeholder='Enter URL'
                    id='linkUrl'
                    className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                  />
                  <Input
                    placeholder='Description (optional)'
                    id='linkDescription'
                    className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-shrink-0 border-tawakal-blue text-tawakal-blue hover:bg-tawakal-blue/10'
                    onClick={() => {
                      const urlInput = document.getElementById(
                        "linkUrl"
                      ) as HTMLInputElement;
                      const descInput = document.getElementById(
                        "linkDescription"
                      ) as HTMLInputElement;
                      if (urlInput.value) {
                        addMedia("link", {
                          url: urlInput.value,
                          description: descInput.value,
                        });
                        urlInput.value = "";
                        descInput.value = "";
                      }
                    }}>
                    <Plus className='h-4 w-4 mr-1' />
                    Add
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value='image'>
                <div className='flex gap-2 mb-4'>
                  <Input
                    type='file'
                    accept='image/*'
                    id='imageUpload'
                    className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                  />
                  <Input
                    placeholder='Description (optional)'
                    id='imageDescription'
                    className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                  />
                  <Button
                    type='button'
                    variant='outline'
                    className='flex-shrink-0 border-tawakal-green text-tawakal-green hover:bg-tawakal-green/10'
                    onClick={() => {
                      const fileInput = document.getElementById(
                        "imageUpload"
                      ) as HTMLInputElement;
                      const descInput = document.getElementById(
                        "imageDescription"
                      ) as HTMLInputElement;
                      if (fileInput.files && fileInput.files[0]) {
                        addMedia("image", {
                          file: fileInput.files[0],
                          description: descInput.value,
                        });
                        fileInput.value = "";
                        descInput.value = "";
                      }
                    }}>
                    <Upload className='h-4 w-4 mr-1' />
                    Upload
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value='document'>
                <div className='bg-muted/50 p-3 rounded-md mb-3'>
                  <h4 className='text-sm font-medium mb-2 text-tawakal-blue'>
                    Choose an option:
                  </h4>
                  <div className='flex gap-3 mb-2'>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className={cn(
                        "flex-1 border-tawakal-gold",
                        documentInputType === "link" &&
                          "bg-tawakal-gold/10 text-tawakal-gold"
                      )}
                      onClick={() => setDocumentInputType("link")}>
                      <LinkIcon className='h-4 w-4 mr-2' />
                      Google Docs Link
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      className={cn(
                        "flex-1 border-tawakal-gold",
                        documentInputType === "upload" &&
                          "bg-tawakal-gold/10 text-tawakal-gold"
                      )}
                      onClick={() => setDocumentInputType("upload")}>
                      <Upload className='h-4 w-4 mr-2' />
                      Upload Document
                    </Button>
                  </div>
                </div>

                {documentInputType === "upload" ? (
                  <div className='flex gap-2 mb-4'>
                    <Input
                      type='file'
                      accept='.pdf,.docx,.xlsx,.txt'
                      id='docUpload'
                      className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                    />
                    <Input
                      placeholder='Description (optional)'
                      id='docDescription'
                      className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      className='flex-shrink-0 border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'
                      onClick={() => {
                        const fileInput = document.getElementById(
                          "docUpload"
                        ) as HTMLInputElement;
                        const descInput = document.getElementById(
                          "docDescription"
                        ) as HTMLInputElement;
                        if (fileInput.files && fileInput.files[0]) {
                          addMedia("document", {
                            file: fileInput.files[0],
                            description: descInput.value,
                          });
                          fileInput.value = "";
                          descInput.value = "";
                        }
                      }}>
                      <Upload className='h-4 w-4 mr-1' />
                      Upload
                    </Button>
                  </div>
                ) : (
                  <div className='flex gap-2 mb-4'>
                    <Input
                      placeholder='Enter Google Docs URL'
                      id='docUrl'
                      className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                    />
                    <Input
                      placeholder='Description (optional)'
                      id='docLinkDescription'
                      className='flex-1 border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                    />
                    <Button
                      type='button'
                      variant='outline'
                      className='flex-shrink-0 border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'
                      onClick={() => {
                        const urlInput = document.getElementById(
                          "docUrl"
                        ) as HTMLInputElement;
                        const descInput = document.getElementById(
                          "docLinkDescription"
                        ) as HTMLInputElement;
                        if (urlInput.value) {
                          addMedia("document", {
                            url: urlInput.value,
                            description: descInput.value,
                          });
                          urlInput.value = "";
                          descInput.value = "";
                        }
                      }}>
                      <Plus className='h-4 w-4 mr-1' />
                      Add
                    </Button>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Display added media items */}
            {form.watch("media") && form.watch("media").length > 0 && (
              <div className='mt-4 border-t border-tawakal-blue/20 pt-4'>
                <h4 className='text-sm font-medium mb-2 text-tawakal-blue'>
                  Added Attachments:
                </h4>
                <div className='space-y-2 pr-1'>
                  {form.watch("media").map((item, index) => (
                    <div
                      key={index}
                      className='flex items-center gap-2 text-sm bg-muted p-2 rounded-md'>
                      {item.type === "link" && (
                        <LinkIcon className='h-4 w-4 text-tawakal-blue' />
                      )}
                      {item.type === "image" && (
                        <Upload className='h-4 w-4 text-tawakal-green' />
                      )}
                      {item.type === "document" && (
                        <Upload className='h-4 w-4 text-tawakal-gold' />
                      )}
                      <span className='flex-1 truncate'>
                        {item.type === "link"
                          ? item.url
                          : item.type === "document" && item.url
                          ? item.url
                          : item.file?.name}
                        {item.description && ` - ${item.description}`}
                      </span>
                      <Button
                        type='button'
                        variant='ghost'
                        size='sm'
                        onClick={() => removeMedia(index)}
                        className='text-tawakal-red/70 hover:text-tawakal-red hover:bg-tawakal-red/10'>
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className='flex justify-end gap-3 p-4 border-t mt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              window.history.back();
            }}
            className='border border-gray-300 text-gray-700 hover:bg-gray-50'>
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-tawakal-blue hover:bg-tawakal-blue/90 text-white font-medium min-w-[120px]'>
            {isSubmitting ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
