import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
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
    <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
      <div className='mb-6 sm:mb-8'>
        <h1 className='text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-2'>
          Profile Settings
        </h1>
        <p className='text-lg text-gray-600 dark:text-gray-300'>
          Manage your account information and preferences
        </p>
      </div>

      {/* Account Information Section */}
      <div className='mb-8 sm:mb-10'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6'>
          <div>
            <h2 className='text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2'>
              Account Information
            </h2>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300'>
              Your personal information and status
            </p>
          </div>
          <Badge
            variant={userData?.is_active ? "default" : "destructive"}
            className={`text-sm sm:text-base px-4 py-2 ${
              userData?.is_active
                ? "bg-tawakal-green text-white"
                : "bg-tawakal-red text-white"
            }`}>
            {userData?.is_active ? "Active Account" : "Inactive Account"}
          </Badge>
        </div>

        <div className='space-y-6 sm:space-y-8'>
          <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
            <div>
              <Label
                htmlFor='firstName'
                className='text-base sm:text-lg font-medium mb-3 block'>
                First Name
              </Label>
              <div className='relative'>
                <UserCircle className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='firstName'
                  className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                  readOnly
                  value={userData?.first_name || ""}
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor='lastName'
                className='text-base sm:text-lg font-medium mb-3 block'>
                Last Name
              </Label>
              <div className='relative'>
                <UserCircle className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  id='lastName'
                  className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                  readOnly
                  value={userData?.last_name || ""}
                />
              </div>
            </div>
          </div>

          <div>
            <Label
              htmlFor='email'
              className='text-base sm:text-lg font-medium mb-3 block'>
              Email Address
            </Label>
            <div className='relative'>
              <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
              <Input
                id='email'
                className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                type='email'
                readOnly
                value={userData?.email || ""}
              />
            </div>
          </div>

          <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
            <div>
              <Label
                htmlFor='role'
                className='text-base sm:text-lg font-medium mb-3 block'>
                Role
              </Label>
              <Input
                id='role'
                readOnly
                className={`h-12 text-base sm:text-lg font-semibold bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2 ${
                  userData?.role === "admin"
                    ? "text-tawakal-red"
                    : "text-tawakal-blue"
                }`}
                value={
                  userData?.role === "admin" ? "Administrator" : "Regular User"
                }
              />
            </div>
            <div>
              <Label
                htmlFor='joinDate'
                className='text-base sm:text-lg font-medium mb-3 block'>
                Member Since
              </Label>
              <Input
                id='joinDate'
                readOnly
                className='h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
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

          <div className='flex flex-col sm:flex-row justify-between sm:items-center gap-4 pt-4 border-t border-gray-200 dark:border-gray-700'>
            <div className='text-lg text-gray-600 dark:text-gray-300'>
              <span>
                Total votes cast:{" "}
                <strong className='text-tawakal-blue text-xl'>
                  {voteCount || 0}
                </strong>
              </span>
            </div>
            <Button className='w-full sm:w-auto bg-tawakal-blue hover:bg-tawakal-blue/90 h-12 text-lg px-8'>
              Update Profile
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue='notifications' className='mt-8'>
        <TabsList className='grid w-full grid-cols-2 h-12 mb-6'>
          <TabsTrigger
            value='notifications'
            className='text-sm sm:text-base px-4 py-3 font-medium'>
            <span className='hidden sm:inline'>Notification Settings</span>
            <span className='sm:hidden'>Notifications</span>
          </TabsTrigger>
          <TabsTrigger
            value='security'
            className='text-sm sm:text-base px-4 py-3 font-medium'>
            Security Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value='notifications'>
          <div className='mb-6'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2'>
              Notification Preferences
            </h2>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300'>
              Manage how and when you receive notifications
            </p>
          </div>

          <div className='space-y-8'>
            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700'>
              <div className='flex items-start gap-4 flex-1'>
                <Bell className='h-6 w-6 mt-1 text-tawakal-blue' />
                <div className='flex-1'>
                  <Label className='text-lg font-semibold text-gray-900 dark:text-white block mb-2'>
                    New Poll Notifications
                  </Label>
                  <p className='text-base text-gray-600 dark:text-gray-300'>
                    Receive notifications when new polls are created
                  </p>
                </div>
              </div>
              <Switch
                checked={notifPrefs?.new_poll_notification || false}
                disabled
                className='self-start sm:self-center'
              />
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700'>
              <div className='flex items-start gap-4 flex-1'>
                <Bell className='h-6 w-6 mt-1 text-tawakal-green' />
                <div className='flex-1'>
                  <Label className='text-lg font-semibold text-gray-900 dark:text-white block mb-2'>
                    Poll Reminders
                  </Label>
                  <p className='text-base text-gray-600 dark:text-gray-300'>
                    Receive reminders for polls you haven't voted on yet
                  </p>
                </div>
              </div>
              <Switch
                checked={notifPrefs?.reminder_notification || false}
                disabled
                className='self-start sm:self-center'
              />
            </div>

            <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-200 dark:border-gray-700'>
              <div className='flex items-start gap-4 flex-1'>
                <Bell className='h-6 w-6 mt-1 text-tawakal-gold' />
                <div className='flex-1'>
                  <Label className='text-lg font-semibold text-gray-900 dark:text-white block mb-2'>
                    Results Notifications
                  </Label>
                  <p className='text-base text-gray-600 dark:text-gray-300'>
                    Receive notifications when polls you've voted on end
                  </p>
                </div>
              </div>
              <Switch
                checked={notifPrefs?.results_notification || false}
                disabled
                className='self-start sm:self-center'
              />
            </div>

            <div className='flex justify-end pt-4'>
              <Button className='w-full sm:w-auto bg-tawakal-green hover:bg-tawakal-green/90 h-12 text-lg px-8'>
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value='security'>
          <div className='mb-6'>
            <h2 className='text-2xl sm:text-3xl font-semibold text-gray-900 dark:text-white mb-2'>
              Security Settings
            </h2>
            <p className='text-base sm:text-lg text-gray-600 dark:text-gray-300'>
              Manage your account password and security preferences
            </p>
          </div>

          <div className='space-y-6 sm:space-y-8'>
            <div>
              <Label className='text-base sm:text-lg font-medium mb-3 block'>
                Current Password
              </Label>
              <div className='relative'>
                <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                <Input
                  className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                  type='password'
                  placeholder='••••••••'
                />
              </div>
            </div>

            <div className='grid gap-4 sm:gap-6 md:grid-cols-2'>
              <div>
                <Label className='text-base sm:text-lg font-medium mb-3 block'>
                  New Password
                </Label>
                <div className='relative'>
                  <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                    type='password'
                    placeholder='••••••••'
                  />
                </div>
              </div>
              <div>
                <Label className='text-base sm:text-lg font-medium mb-3 block'>
                  <span className='hidden sm:inline'>Confirm New Password</span>
                  <span className='sm:hidden'>Confirm Password</span>
                </Label>
                <div className='relative'>
                  <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400' />
                  <Input
                    className='pl-10 h-12 text-base sm:text-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-2'
                    type='password'
                    placeholder='••••••••'
                  />
                </div>
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button className='w-full sm:w-auto bg-tawakal-blue hover:bg-tawakal-blue/90 h-12 text-lg px-8'>
                Change Password
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
