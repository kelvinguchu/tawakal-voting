import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Mail, Key, Bell } from "lucide-react";
import { Switch } from "@/components/ui/switch";

export default async function ProfilePage() {
  // Create the Supabase client
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    console.error("Authentication error:", authError);
    redirect("/login");
  }

  // Fetch user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch notification preferences
  const { data: notifPrefs, error: notifError } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Fetch vote count
  const { count: voteCount, error: voteCountError } = await supabase
    .from("votes")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (userError) {
    console.error("Error fetching user data:", userError);
  }

  return (
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
      <div className='mb-4 sm:mb-6 text-center sm:text-left'>
        <h1 className='text-2xl sm:text-3xl font-bold'>Profile Settings</h1>
      </div>

      <div className='grid gap-4 sm:gap-6 mb-6 sm:mb-8'>
        <Card className='border-2 sm:border'>
          <CardHeader className='pb-3 sm:pb-4 px-4 sm:px-6 pt-4 sm:pt-6'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
              <div>
                <CardTitle className='text-lg sm:text-xl'>
                  Account Information
                </CardTitle>
                <CardDescription className='text-sm sm:text-base'>
                  Your personal information and status
                </CardDescription>
              </div>
              <Badge
                variant={userData?.is_active ? "default" : "destructive"}
                className={`text-xs sm:text-sm ${
                  userData?.is_active
                    ? "bg-tawakal-green text-white"
                    : "bg-tawakal-red text-white"
                }`}>
                {userData?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6'>
            <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='firstName' className='text-sm sm:text-base'>
                  First Name
                </Label>
                <div className='relative mt-1'>
                  <UserCircle className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                  <Input
                    id='firstName'
                    className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                    readOnly
                    value={userData?.first_name || ""}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='lastName' className='text-sm sm:text-base'>
                  Last Name
                </Label>
                <div className='relative mt-1'>
                  <UserCircle className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                  <Input
                    id='lastName'
                    className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                    readOnly
                    value={userData?.last_name || ""}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor='email' className='text-sm sm:text-base'>
                Email Address
              </Label>
              <div className='relative mt-1'>
                <Mail className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                <Input
                  id='email'
                  className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                  type='email'
                  readOnly
                  value={userData?.email || ""}
                />
              </div>
            </div>
            <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='role' className='text-sm sm:text-base'>
                  Role
                </Label>
                <Input
                  id='role'
                  readOnly
                  className={`h-9 sm:h-10 text-sm sm:text-base font-medium ${
                    userData?.role === "admin"
                      ? "text-tawakal-red"
                      : "text-tawakal-blue"
                  }`}
                  value={
                    userData?.role === "admin"
                      ? "Administrator"
                      : "Regular User"
                  }
                />
              </div>
              <div>
                <Label htmlFor='joinDate' className='text-sm sm:text-base'>
                  Joined On
                </Label>
                <Input
                  id='joinDate'
                  readOnly
                  className='h-9 sm:h-10 text-sm sm:text-base'
                  value={
                    userData?.created_at
                      ? new Date(userData.created_at).toLocaleDateString(
                          "en-US",
                          {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )
                      : ""
                  }
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className='px-4 sm:px-6 pb-4 sm:pb-6'>
            <div className='w-full flex flex-col sm:flex-row justify-between sm:items-center gap-3 sm:gap-4'>
              <div className='text-xs sm:text-sm text-muted-foreground text-center sm:text-left'>
                <span>
                  Votes cast:{" "}
                  <strong className='text-tawakal-blue'>
                    {voteCount || 0}
                  </strong>
                </span>
              </div>
              <Button className='w-full sm:w-auto bg-tawakal-blue hover:bg-tawakal-blue/90 h-9 sm:h-10 text-sm sm:text-base'>
                Update Profile
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Tabs defaultValue='notifications'>
          <TabsList className='grid w-full grid-cols-2 h-auto'>
            <TabsTrigger
              value='notifications'
              className='text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3'>
              <span className='hidden sm:inline'>Notification Settings</span>
              <span className='sm:hidden'>Notifications</span>
            </TabsTrigger>
            <TabsTrigger
              value='security'
              className='text-xs sm:text-sm px-2 sm:px-4 py-2 sm:py-3'>
              Security
            </TabsTrigger>
          </TabsList>
          <TabsContent value='notifications' className='mt-3 sm:mt-4'>
            <Card className='border-2 sm:border'>
              <CardHeader className='px-4 sm:px-6 pt-4 sm:pt-6'>
                <CardTitle className='text-lg sm:text-xl'>
                  Notification Preferences
                </CardTitle>
                <CardDescription className='text-sm sm:text-base'>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6'>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
                  <div className='flex items-start gap-2 sm:gap-3 flex-1'>
                    <Bell className='h-4 w-4 mt-0.5 text-tawakal-blue' />
                    <div className='flex-1'>
                      <Label
                        htmlFor='newPollNotification'
                        className='text-sm sm:text-base font-medium'>
                        New Poll Notifications
                      </Label>
                      <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
                        Receive notifications when new polls are created
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='newPollNotification'
                    checked={notifPrefs?.new_poll_notification || false}
                    disabled
                    className='self-start sm:self-center'
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
                  <div className='flex items-start gap-2 sm:gap-3 flex-1'>
                    <Bell className='h-4 w-4 mt-0.5 text-tawakal-green' />
                    <div className='flex-1'>
                      <Label
                        htmlFor='reminderNotification'
                        className='text-sm sm:text-base font-medium'>
                        Poll Reminders
                      </Label>
                      <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
                        Receive reminders for polls you haven't voted on yet
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='reminderNotification'
                    checked={notifPrefs?.reminder_notification || false}
                    disabled
                    className='self-start sm:self-center'
                  />
                </div>
                <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4'>
                  <div className='flex items-start gap-2 sm:gap-3 flex-1'>
                    <Bell className='h-4 w-4 mt-0.5 text-tawakal-gold' />
                    <div className='flex-1'>
                      <Label
                        htmlFor='resultsNotification'
                        className='text-sm sm:text-base font-medium'>
                        Results Notifications
                      </Label>
                      <p className='text-xs sm:text-sm text-muted-foreground mt-1'>
                        Receive notifications when polls you've voted on end
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='resultsNotification'
                    checked={notifPrefs?.results_notification || false}
                    disabled
                    className='self-start sm:self-center'
                  />
                </div>
              </CardContent>
              <CardFooter className='px-4 sm:px-6 pb-4 sm:pb-6'>
                <Button className='w-full sm:w-auto bg-tawakal-green hover:bg-tawakal-green/90 h-9 sm:h-10 text-sm sm:text-base'>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value='security' className='mt-3 sm:mt-4'>
            <Card className='border-2 sm:border'>
              <CardHeader className='px-4 sm:px-6 pt-4 sm:pt-6'>
                <CardTitle className='text-lg sm:text-xl'>
                  Security Settings
                </CardTitle>
                <CardDescription className='text-sm sm:text-base'>
                  Manage your account password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4 sm:space-y-6 px-4 sm:px-6'>
                <div>
                  <Label
                    htmlFor='currentPassword'
                    className='text-sm sm:text-base'>
                    Current Password
                  </Label>
                  <div className='relative mt-1'>
                    <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                    <Input
                      id='currentPassword'
                      className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                      type='password'
                      placeholder='••••••••'
                    />
                  </div>
                </div>
                <div className='grid gap-3 sm:gap-4 md:grid-cols-2'>
                  <div>
                    <Label
                      htmlFor='newPassword'
                      className='text-sm sm:text-base'>
                      New Password
                    </Label>
                    <div className='relative mt-1'>
                      <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                      <Input
                        id='newPassword'
                        className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                        type='password'
                        placeholder='••••••••'
                      />
                    </div>
                  </div>
                  <div>
                    <Label
                      htmlFor='confirmPassword'
                      className='text-sm sm:text-base'>
                      <span className='hidden sm:inline'>
                        Confirm New Password
                      </span>
                      <span className='sm:hidden'>Confirm Password</span>
                    </Label>
                    <div className='relative mt-1'>
                      <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground' />
                      <Input
                        id='confirmPassword'
                        className='pl-7 sm:pl-8 h-9 sm:h-10 text-sm sm:text-base'
                        type='password'
                        placeholder='••••••••'
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className='px-4 sm:px-6 pb-4 sm:pb-6'>
                <Button className='w-full sm:w-auto bg-tawakal-blue hover:bg-tawakal-blue/90 h-9 sm:h-10 text-sm sm:text-base'>
                  Change Password
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
