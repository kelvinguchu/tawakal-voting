"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "next/navigation";
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
import { CalendarIcon, Clock, Plus, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { addHours } from "date-fns";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";

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

  const [startImmediately, setStartImmediately] = useState(false);
  const router = useRouter();
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
      startImmediately,
    });
    console.log("User ID:", userId);
    console.log("User role:", userRole);

    // Check for file attachments (options with images)
    const optionsWithImages = values.options.filter(
      (opt) => opt.image instanceof File
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

      // Upload option images
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
            .then(async (res) => {
              if (!res.ok) {
                const errorData = await res.json();
                console.error(
                  `Failed to upload image for option ${option.text}:`,
                  errorData
                );

                // Show specific error message to user
                if (errorData.message?.includes("row-level security policy")) {
                  toast.error(
                    `Failed to upload option image: Database permission error. Please contact support.`
                  );
                } else if (errorData.message?.includes("Unauthorized")) {
                  toast.error(
                    `Failed to upload option image: You don't have permission to upload files.`
                  );
                } else {
                  toast.error(
                    `Failed to upload option image: ${
                      errorData.message || "Unknown error"
                    }`
                  );
                }

                return Promise.reject(errorData);
              }
              return res.json();
            })
            .then((data) => {
              console.log(
                `Successfully uploaded option image: ${data.filePath}`
              );
              toast.success(
                `Successfully uploaded image for option: ${option.text}`
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

      // Wait for all uploads to complete
      const uploadResults = await Promise.allSettled(optionUploadPromises);

      // Check if any uploads failed
      const failedUploads = uploadResults.filter(
        (result) => result.status === "rejected"
      );
      const successfulUploads = uploadResults.filter(
        (result) => result.status === "fulfilled" && result.value !== null
      );

      if (failedUploads.length > 0) {
        console.warn(
          `${failedUploads.length} uploads failed out of ${uploadResults.length} total`
        );
        toast.warning(
          `Poll created successfully, but ${failedUploads.length} file uploads failed. You can try uploading them again later.`
        );
      } else if (uploadResults.length > 0) {
        toast.success(
          `Poll created successfully with ${successfulUploads.length} files uploaded!`
        );
      } else {
        toast.success("Poll created successfully!");
      }

      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to dashboard page if no onSuccess handler
        router.push("/dashboard");
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

          <div className='mb-6'>
            <FormField
              control={form.control}
              name='status'
              render={({ field }) => (
                <FormItem className='mb-0'>
                  <FormLabel className='text-gray-700 font-medium mb-1'>
                    Poll Status
                  </FormLabel>
                  <div>
                    <Badge
                      variant='outline'
                      className={cn(
                        "px-3 py-1 text-sm",
                        field.value === "active"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      )}>
                      {field.value === "active"
                        ? "Active (Starts immediately)"
                        : "Scheduled (Starts at specified time)"}
                    </Badge>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Mobile-first responsive grid */}
          <div className='space-y-4 sm:space-y-6'>
            {/* Start Option - Full width on mobile */}
            <div>
              <FormItem>
                <FormLabel className='text-gray-700 font-medium text-sm sm:text-base'>
                  Start Option
                </FormLabel>
                <div
                  className={cn(
                    "flex items-center h-10 sm:h-11 px-3 border rounded-md",
                    startImmediately
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-white"
                  )}>
                  <div className='flex items-center min-w-0'>
                    <input
                      type='checkbox'
                      id='startImmediately'
                      checked={startImmediately}
                      onChange={(e) => {
                        setStartImmediately(e.target.checked);
                        if (e.target.checked) {
                          // When checked, set start date to now
                          const now = new Date();
                          form.setValue("startDate", now);

                          // Format the current time as HH:MM for the time input
                          const hours = now
                            .getHours()
                            .toString()
                            .padStart(2, "0");
                          const minutes = now
                            .getMinutes()
                            .toString()
                            .padStart(2, "0");
                          form.setValue("startTime", `${hours}:${minutes}`);

                          // Set status to active
                          form.setValue("status", "active");
                        } else {
                          // When unchecked, set status back to scheduled
                          form.setValue("status", "scheduled");
                        }
                      }}
                      className='h-3 w-3 sm:h-4 sm:w-4 rounded border-gray-300 text-green-600 focus:ring-green-500'
                    />
                    <label
                      htmlFor='startImmediately'
                      className='text-xs sm:text-sm font-medium cursor-pointer ml-2 whitespace-nowrap'>
                      Start immediately
                    </label>
                  </div>
                  {startImmediately && (
                    <Badge
                      variant='outline'
                      className='ml-auto bg-green-50 text-green-700 border-green-200 text-xs'>
                      Now
                    </Badge>
                  )}
                </div>
              </FormItem>
            </div>

            {/* Date, Time, Duration - Responsive grid */}
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
              <div className='sm:col-span-2'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                      <FormLabel className='text-gray-700 font-medium text-sm sm:text-base'>
                      Start Date
                    </FormLabel>
                    <div className='relative'>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant='outline'
                              className={cn(
                                  "w-full pl-3 text-left font-normal border border-gray-300 bg-white hover:bg-gray-50 h-10 sm:h-11 text-xs sm:text-sm",
                                startImmediately && "opacity-60 bg-gray-50",
                                !field.value && "text-muted-foreground"
                              )}
                              disabled={startImmediately}>
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                                <CalendarIcon className='ml-auto h-3 w-3 sm:h-4 sm:w-4 opacity-70' />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date() || startImmediately
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <div>
              <FormField
                control={form.control}
                name='startTime'
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className='text-gray-700 font-medium text-sm sm:text-base'>
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <div className='relative'>
                        <Input
                          type='time'
                          {...field}
                          disabled={startImmediately}
                          className={cn(
                              "pl-8 sm:pl-9 border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue h-10 sm:h-11 text-xs sm:text-sm",
                            startImmediately && "opacity-60 bg-gray-50"
                          )}
                        />
                          <Clock className='absolute left-2 sm:left-3 top-2.5 sm:top-3 h-3 w-3 sm:h-4 sm:w-4 text-gray-500' />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <div>
              <FormField
                control={form.control}
                name='duration'
                render={({ field }) => (
                  <FormItem>
                      <FormLabel className='text-gray-700 font-medium text-sm sm:text-base'>
                      Duration (hours)
                    </FormLabel>
                    <FormControl>
                      <div className='flex items-center'>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                            className='h-10 w-8 sm:h-11 sm:w-10 rounded-r-none border-gray-300 text-gray-700 text-xs sm:text-sm'
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
                            className='h-10 sm:h-11 text-center rounded-none border-x-0 border-gray-300 text-xs sm:text-sm'
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
                            className='h-10 w-8 sm:h-11 sm:w-10 rounded-l-none border-gray-300 text-gray-700 text-xs sm:text-sm'
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
          </div>

          <div className='pt-4 border-t'>
            <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-0 mb-4'>
              <FormLabel className='text-gray-700 font-medium text-sm sm:text-base m-0'>
                Poll Options
              </FormLabel>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addOption}
                className='flex items-center gap-1 border-gray-300 hover:bg-gray-50 text-gray-700 w-full sm:w-auto text-xs sm:text-sm h-9 sm:h-8'>
                <Plus className='h-3 w-3 sm:h-4 sm:w-4' />
                <span>Add Option</span>
              </Button>
            </div>

            <div className='space-y-3 sm:space-y-4'>
              {form.watch("options").map((option, index) => (
                <div
                  key={index}
                  className='space-y-3 p-3 sm:p-4 border rounded-md bg-gray-50'>
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
                              className='border-gray-300 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue h-10 sm:h-11 text-xs sm:text-sm'
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
                      className='text-gray-500 hover:text-red-500 hover:bg-red-50 h-10 w-10 sm:h-11 sm:w-11'>
                      <Trash2 className='h-3 w-3 sm:h-4 sm:w-4' />
                    </Button>
                  </div>

                  {/* Option image upload */}
                  <div className='space-y-2'>
                    <div className='flex items-center'>
                      <span className='text-xs sm:text-sm text-gray-500 font-medium'>
                          Image (optional)
                        </span>
                      </div>
                    <div className='flex flex-col sm:flex-row gap-2'>
                        <Input
                          type='file'
                          accept='image/*'
                          id={`option-image-${index}`}
                        className='flex-1 text-xs sm:text-sm border-gray-300 h-9 sm:h-10'
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
                        className='flex-1 text-xs sm:text-sm border-gray-300 h-9 sm:h-10'
                        />
                      </div>
                      {option.image && (
                      <div className='flex items-center mt-1 text-xs text-green-600 bg-green-50 p-2 rounded'>
                        <Upload className='h-3 w-3 mr-1 flex-shrink-0' />
                        <span className='truncate flex-1'>
                          {option.image.name}
                        </span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                          className='ml-2 h-6 w-6 p-0 text-gray-400 hover:text-red-400'
                            onClick={() =>
                              handleOptionImageChange(index, undefined, "")
                            }>
                            <Trash2 className='h-3 w-3' />
                          </Button>
                        </div>
                      )}
                  </div>
                </div>
              ))}
            </div>
            {form.formState.errors.options?.message && (
              <p className='text-xs sm:text-sm font-medium text-destructive mt-2'>
                {form.formState.errors.options?.message}
              </p>
            )}
          </div>
            </div>

        <div className='flex flex-col sm:flex-row sm:justify-end gap-3 p-4 sm:p-6 border-t mt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              window.history.back();
            }}
            className='border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 sm:h-9 text-sm sm:text-sm order-2 sm:order-1'>
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-tawakal-blue hover:bg-tawakal-blue/90 text-white font-medium min-w-[120px] h-10 sm:h-9 text-sm sm:text-sm order-1 sm:order-2'>
            {isSubmitting ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
