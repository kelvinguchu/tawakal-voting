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
    <div className='max-w-4xl mx-auto'>
      <div className='mb-6'>
        <h1 className='text-3xl font-bold'>Profile Settings</h1>
        <p className='text-muted-foreground'>
          Manage your account settings and preferences
        </p>
      </div>

      <div className='grid gap-6 mb-8'>
        <Card>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>
                  Your personal information and status
                </CardDescription>
              </div>
              <Badge
                variant={userData?.is_active ? "default" : "destructive"}
                className={
                  userData?.is_active
                    ? "bg-tawakal-green text-white"
                    : "bg-tawakal-red text-white"
                }>
                {userData?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className='space-y-6'>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='firstName'>First Name</Label>
                <div className='relative mt-1'>
                  <UserCircle className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='firstName'
                    className='pl-8'
                    readOnly
                    value={userData?.first_name || ""}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor='lastName'>Last Name</Label>
                <div className='relative mt-1'>
                  <UserCircle className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                  <Input
                    id='lastName'
                    className='pl-8'
                    readOnly
                    value={userData?.last_name || ""}
                  />
                </div>
              </div>
            </div>
            <div>
              <Label htmlFor='email'>Email Address</Label>
              <div className='relative mt-1'>
                <Mail className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                <Input
                  id='email'
                  className='pl-8'
                  type='email'
                  readOnly
                  value={userData?.email || ""}
                />
              </div>
            </div>
            <div className='grid gap-4 md:grid-cols-2'>
              <div>
                <Label htmlFor='role'>Role</Label>
                <Input
                  id='role'
                  readOnly
                  value={
                    userData?.role === "admin"
                      ? "Administrator"
                      : "Regular User"
                  }
                  className={
                    userData?.role === "admin"
                      ? "text-tawakal-red"
                      : "text-tawakal-blue"
                  }
                />
              </div>
              <div>
                <Label htmlFor='joinDate'>Joined On</Label>
                <Input
                  id='joinDate'
                  readOnly
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
          <CardFooter>
            <div className='w-full flex justify-between items-center'>
              <div className='text-sm text-muted-foreground'>
                <span>
                  Votes cast: <strong>{voteCount || 0}</strong>
                </span>
              </div>
              <Button className='bg-tawakal-blue hover:bg-tawakal-blue/90'>
                Update Profile
              </Button>
            </div>
          </CardFooter>
        </Card>

        <Tabs defaultValue='notifications'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='notifications'>
              Notification Settings
            </TabsTrigger>
            <TabsTrigger value='security'>Security</TabsTrigger>
          </TabsList>
          <TabsContent value='notifications' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Manage how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bell className='h-4 w-4' />
                    <div>
                      <Label
                        htmlFor='newPollNotification'
                        className='text-sm font-medium'>
                        New Poll Notifications
                      </Label>
                      <p className='text-xs text-muted-foreground'>
                        Receive notifications when new polls are created
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='newPollNotification'
                    checked={notifPrefs?.new_poll_notification || false}
                    disabled
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bell className='h-4 w-4' />
                    <div>
                      <Label
                        htmlFor='reminderNotification'
                        className='text-sm font-medium'>
                        Poll Reminders
                      </Label>
                      <p className='text-xs text-muted-foreground'>
                        Receive reminders for polls you haven't voted on yet
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='reminderNotification'
                    checked={notifPrefs?.reminder_notification || false}
                    disabled
                  />
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Bell className='h-4 w-4' />
                    <div>
                      <Label
                        htmlFor='resultsNotification'
                        className='text-sm font-medium'>
                        Results Notifications
                      </Label>
                      <p className='text-xs text-muted-foreground'>
                        Receive notifications when polls you've voted on end
                      </p>
                    </div>
                  </div>
                  <Switch
                    id='resultsNotification'
                    checked={notifPrefs?.results_notification || false}
                    disabled
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button className='bg-tawakal-green hover:bg-tawakal-green/90'>
                  Save Preferences
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
          <TabsContent value='security' className='mt-4'>
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account password and security preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <Label htmlFor='currentPassword'>Current Password</Label>
                  <div className='relative mt-1'>
                    <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                    <Input
                      id='currentPassword'
                      className='pl-8'
                      type='password'
                      placeholder='••••••••'
                    />
                  </div>
                </div>
                <div className='grid gap-4 md:grid-cols-2'>
                  <div>
                    <Label htmlFor='newPassword'>New Password</Label>
                    <div className='relative mt-1'>
                      <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='newPassword'
                        className='pl-8'
                        type='password'
                        placeholder='••••••••'
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor='confirmPassword'>
                      Confirm New Password
                    </Label>
                    <div className='relative mt-1'>
                      <Key className='absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
                      <Input
                        id='confirmPassword'
                        className='pl-8'
                        type='password'
                        placeholder='••••••••'
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className='bg-tawakal-blue hover:bg-tawakal-blue/90'>
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
