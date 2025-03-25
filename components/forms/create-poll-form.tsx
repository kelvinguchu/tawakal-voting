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
  description: z.string().min(10, {
    message: "Description must be at least 10 characters.",
  }),
  status: z.enum(["draft", "scheduled", "active"]),
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
}

export function CreatePollForm({ onSuccess, userId }: CreatePollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mediaTab, setMediaTab] = useState<string>("link");
  const [documentInputType, setDocumentInputType] = useState<"upload" | "link">(
    "link"
  );
  const supabase = createClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "active",
      startTime: "12:00",
      duration: 5,
      options: [{ text: "", image: undefined, imageDescription: "" }],
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
    const options = [...form.getValues("options")];
    if (options[index]) {
      options[index] = {
        ...options[index],
        image: file,
        imageDescription: description,
      };
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

    setIsSubmitting(true);

    try {
      const startDateTime = new Date(values.startDate);
      const [hours, minutes] = values.startTime.split(":").map(Number);
      startDateTime.setHours(hours, minutes, 0, 0);

      const endDateTime = calculateEndTime(
        values.startDate,
        values.startTime,
        values.duration
      );

      // Create the poll
      const { data: poll, error: pollError } = await supabase
        .from("polls")
        .insert({
          title: values.title,
          description: values.description,
          start_time: startDateTime.toISOString(),
          end_time: endDateTime.toISOString(),
          created_by: userId,
          status: values.status,
        })
        .select()
        .single();

      if (pollError) {
        throw pollError;
      }

      // Add poll options
      for (let i = 0; i < values.options.length; i++) {
        const option = values.options[i];

        // Insert the option
        const { data: optionData, error: optionError } = await supabase
          .from("poll_options")
          .insert({
            poll_id: poll.id,
            option_text: option.text,
          })
          .select()
          .single();

        if (optionError) {
          throw optionError;
        }

        // If there's an image for this option, upload it
        if (option.image) {
          const fileExt = option.image.name.split(".").pop();
          const fileName = `${poll.id}/options/${
            optionData.id
          }_${Date.now()}.${fileExt}`;

          // Upload the image to Storage
          const { error: uploadError } = await supabase.storage
            .from("vote-media")
            .upload(fileName, option.image);

          if (uploadError) {
            console.error("Error uploading option image:", uploadError);
            // Continue even if image upload fails
            continue;
          }

          // Link the image to the option
          const { error: optionMediaError } = await supabase
            .from("option_media")
            .insert({
              option_id: optionData.id,
              media_type: "image",
              storage_path: fileName,
              description: option.imageDescription || null,
            });

          if (optionMediaError) {
            console.error("Error linking image to option:", optionMediaError);
          }
        }
      }

      // Handle poll media attachments if any
      if (values.media && values.media.length > 0) {
        // Process each media item
        for (const item of values.media) {
          if (item.type === "link" && item.url) {
            // Add link directly to poll_media table
            await supabase.from("poll_media").insert({
              poll_id: poll.id,
              media_type: "link",
              media_url: item.url,
              description: item.description || null,
            });
          } else if (
            (item.type === "image" || item.type === "document") &&
            item.file
          ) {
            // Upload file to storage
            const fileExt = item.file.name.split(".").pop();
            const fileName = `${poll.id}/${Date.now()}.${fileExt}`;
            const { error: uploadError, data: uploadData } =
              await supabase.storage
                .from("vote-media")
                .upload(fileName, item.file);

            if (!uploadError && uploadData) {
              // Add file reference to poll_media table
              await supabase.from("poll_media").insert({
                poll_id: poll.id,
                media_type: item.type,
                storage_path: fileName,
                description: item.description || null,
              });
            }
          }
        }
      }

      toast.success("Poll created successfully!");
      form.reset();
      if (onSuccess) {
        onSuccess();
      } else {
        // Redirect to polls page if no onSuccess handler
        window.location.href = "/polls";
      }
    } catch (error) {
      console.error("Error creating poll:", error);
      toast.error("Failed to create poll. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='flex flex-col'>
        <div className='space-y-6'>
          <FormField
            control={form.control}
            name='title'
            render={({ field }) => (
              <FormItem>
                <FormLabel className='text-tawakal-blue font-medium'>
                  Poll Title
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder='Enter a question or title'
                    {...field}
                    className='border border-tawakal-blue/30 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
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
                <FormLabel className='text-tawakal-blue font-medium'>
                  Description
                </FormLabel>
                <FormControl>
                  <Textarea
                    placeholder='Provide more details about this poll'
                    className='min-h-[100px] border border-tawakal-blue/30 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
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
              <FormItem>
                <FormLabel className='text-tawakal-blue font-medium'>
                  Status
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className='border border-tawakal-blue/30 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'>
                      <SelectValue placeholder='Select poll status' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='draft'>Draft</SelectItem>
                    <SelectItem value='scheduled'>Scheduled</SelectItem>
                    <SelectItem value='active'>Active</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <FormField
              control={form.control}
              name='startDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel className='text-tawakal-blue font-medium'>
                    Start Date
                  </FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(
                            "pl-3 text-left font-normal border border-tawakal-blue/30 w-full",
                            !field.value && "text-muted-foreground"
                          )}>
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 text-tawakal-blue opacity-70' />
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='startTime'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-tawakal-blue font-medium'>
                    Start Time
                  </FormLabel>
                  <FormControl>
                    <div className='relative'>
                      <Input
                        type='time'
                        {...field}
                        className='pl-9 border border-tawakal-blue/30 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
                      />
                      <Clock className='absolute left-3 top-2.5 h-4 w-4 text-tawakal-blue opacity-70' />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='duration'
              render={({ field }) => (
                <FormItem>
                  <FormLabel className='text-tawakal-blue font-medium'>
                    Duration (hours)
                  </FormLabel>
                  <FormControl>
                    <div className='flex items-center space-x-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-9 w-9 border border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'
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
                        className='text-center border border-tawakal-blue/30 focus-visible:ring-tawakal-blue focus-visible:border-tawakal-blue'
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
                        className='h-9 w-9 border border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'
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

          <div className='pt-2'>
            <div className='flex justify-between items-center mb-3'>
              <FormLabel className='text-tawakal-blue font-medium text-base'>
                Poll Options
              </FormLabel>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={addOption}
                className='flex items-center gap-1 border-tawakal-gold text-tawakal-gold hover:bg-tawakal-gold/10'>
                <Plus className='h-4 w-4' />
                <span>Add Option</span>
              </Button>
            </div>

            <div className='space-y-3 pr-1 pb-1'>
              {form.watch("options").map((option, index) => (
                <div key={index} className='space-y-2'>
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
                              className='border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
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
                      className='text-tawakal-red/70 hover:text-tawakal-red hover:bg-tawakal-red/10'>
                      <Trash2 className='h-4 w-4' />
                    </Button>
                  </div>

                  {/* Option image upload */}
                  <div className='flex items-center gap-2 ml-2 mt-1'>
                    <div className='flex-1'>
                      <div className='flex items-center mb-1'>
                        <span className='text-xs text-tawakal-blue/60 font-medium'>
                          Option Image (e.g., candidate photo)
                        </span>
                      </div>
                      <div className='flex gap-2'>
                        <Input
                          type='file'
                          accept='image/*'
                          id={`option-image-${index}`}
                          className='flex-1 text-xs border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
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
                          className='flex-1 text-xs border-tawakal-blue/30 focus-visible:ring-tawakal-blue/50'
                        />
                      </div>
                      {option.image && (
                        <div className='flex items-center mt-1 text-xs text-tawakal-green'>
                          <Upload className='h-3 w-3 mr-1' />
                          <span className='truncate'>{option.image.name}</span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='ml-auto h-5 w-5 p-0 text-tawakal-red/70'
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
          <div className='border border-tawakal-blue/20 rounded-md p-5 bg-tawakal-blue/5'>
            <div className='flex justify-between items-center mb-4'>
              <FormLabel className='text-tawakal-blue font-medium text-base'>
                Media Attachments
              </FormLabel>
            </div>

            <Tabs value={mediaTab} onValueChange={setMediaTab}>
              <TabsList className='grid w-full grid-cols-3 mb-4 bg-tawakal-blue/10'>
                <TabsTrigger
                  value='link'
                  className='data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
                  Link
                </TabsTrigger>
                <TabsTrigger
                  value='image'
                  className='data-[state=active]:bg-tawakal-green data-[state=active]:text-white'>
                  Image
                </TabsTrigger>
                <TabsTrigger
                  value='document'
                  className='data-[state=active]:bg-tawakal-gold data-[state=active]:text-white'>
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

        <div className='flex justify-end gap-3 p-4 border-t border-border mt-6'>
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              window.history.back();
            }}
            className='border border-tawakal-red/50 text-tawakal-red hover:bg-tawakal-red/10'>
            Cancel
          </Button>
          <Button
            type='submit'
            disabled={isSubmitting}
            className='bg-tawakal-blue hover:bg-tawakal-blue/90 text-white font-medium min-w-[120px] border-0'>
            {isSubmitting ? "Creating..." : "Create Poll"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
