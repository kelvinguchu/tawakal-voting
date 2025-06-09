import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserCircle, Mail, Key, Bell, Shield, Settings } from "lucide-react";
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
      {/* Profile Header */}
      <div className='mb-8'>
        <div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
          <div>
            <h1 className='text-3xl sm:text-4xl font-bold text-tawakal-blue mb-2'>
              {userData?.first_name} {userData?.last_name}
            </h1>
            <div className='flex items-center gap-3'>
              <span className='text-lg text-gray-600 dark:text-gray-300'>
                {userData?.email}
              </span>
              <Badge
                variant={userData?.is_active ? "default" : "destructive"}
                className={`${
                  userData?.is_active
                    ? "bg-tawakal-green text-white"
                    : "bg-tawakal-red text-white"
                }`}>
                {userData?.is_active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </div>

          <div className='flex flex-col sm:items-end gap-2'>
            <Badge
              variant='outline'
              className={`text-base px-4 py-2 ${
                userData?.role === "admin"
                  ? "border-tawakal-red text-tawakal-red"
                  : "border-tawakal-blue text-tawakal-blue"
              }`}>
              {userData?.role === "admin" ? "Administrator" : "User"}
            </Badge>
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              Member since{" "}
              {userData?.created_at
                ? new Date(userData.created_at).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                  })
                : ""}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Card */}
      <div className='mb-8 p-6 bg-gradient-to-r from-tawakal-green/10 to-tawakal-blue/10 rounded-xl border border-tawakal-green/20'>
        <div className='flex items-center justify-between'>
          <div>
            <h3 className='text-lg font-semibold text-tawakal-blue mb-1'>
              Voting Activity
            </h3>
            <div className='text-3xl font-bold text-tawakal-green'>
              {voteCount || 0}
            </div>
            <div className='text-sm text-gray-600 dark:text-gray-300'>
              Total votes cast
            </div>
          </div>
          <div className='w-16 h-16 bg-tawakal-blue/10 rounded-full flex items-center justify-center'>
            <Settings className='w-8 h-8 text-tawakal-blue' />
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <Tabs defaultValue='account' className='w-full'>
        <TabsList className='bg-muted/30 p-0.5 grid grid-cols-3 w-full rounded-md mb-6'>
          <TabsTrigger
            value='account'
            className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-blue data-[state=active]:text-white'>
            <UserCircle className='w-4 h-4 mr-2' />
            Account
          </TabsTrigger>
          <TabsTrigger
            value='notifications'
            className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-green data-[state=active]:text-white'>
            <Bell className='w-4 h-4 mr-2' />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value='security'
            className='flex items-center text-sm px-4 py-2 rounded-md data-[state=active]:bg-tawakal-red data-[state=active]:text-white'>
            <Shield className='w-4 h-4 mr-2' />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value='account' className='space-y-6'>
          <div>
            <h2 className='text-2xl font-bold text-tawakal-blue mb-6'>
              Account Information
            </h2>

            <div className='grid gap-6 md:grid-cols-2'>
              <div>
                <Label
                  htmlFor='firstName'
                  className='text-base font-medium mb-3 block'>
                  First Name
                </Label>
                <div className='relative'>
                  <UserCircle className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-blue/60' />
                  <Input
                    id='firstName'
                    className='pl-10 h-12 text-base border-tawakal-blue/20 focus:border-tawakal-blue'
                    readOnly
                    value={userData?.first_name || ""}
                  />
                </div>
              </div>

              <div>
                <Label
                  htmlFor='lastName'
                  className='text-base font-medium mb-3 block'>
                  Last Name
                </Label>
                <div className='relative'>
                  <UserCircle className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-blue/60' />
                  <Input
                    id='lastName'
                    className='pl-10 h-12 text-base border-tawakal-blue/20 focus:border-tawakal-blue'
                    readOnly
                    value={userData?.last_name || ""}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label
                htmlFor='email'
                className='text-base font-medium mb-3 block'>
                Email Address
              </Label>
              <div className='relative'>
                <Mail className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-blue/60' />
                <Input
                  id='email'
                  className='pl-10 h-12 text-base border-tawakal-blue/20 focus:border-tawakal-blue'
                  type='email'
                  readOnly
                  value={userData?.email || ""}
                />
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button className='bg-tawakal-blue hover:bg-tawakal-blue/90 h-12 text-base px-8'>
                Update Profile
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value='notifications' className='space-y-6'>
          <div>
            <h2 className='text-2xl font-bold text-tawakal-green mb-6'>
              Notification Preferences
            </h2>

            <div className='space-y-6'>
              <div className='flex items-center justify-between p-4 rounded-lg border border-tawakal-green/20 bg-tawakal-green/5'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-tawakal-green/10 rounded-full flex items-center justify-center'>
                    <Bell className='h-5 w-5 text-tawakal-green' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-tawakal-green'>
                      New Poll Notifications
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      Get notified when new polls are created
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs?.new_poll_notification || false}
                  disabled
                  className='data-[state=checked]:bg-tawakal-green'
                />
              </div>

              <div className='flex items-center justify-between p-4 rounded-lg border border-tawakal-blue/20 bg-tawakal-blue/5'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-tawakal-blue/10 rounded-full flex items-center justify-center'>
                    <Bell className='h-5 w-5 text-tawakal-blue' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-tawakal-blue'>
                      Poll Reminders
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      Reminders for polls you haven't voted on
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs?.reminder_notification || false}
                  disabled
                  className='data-[state=checked]:bg-tawakal-blue'
                />
              </div>

              <div className='flex items-center justify-between p-4 rounded-lg border border-tawakal-gold/20 bg-tawakal-gold/5'>
                <div className='flex items-center gap-4'>
                  <div className='w-10 h-10 bg-tawakal-gold/10 rounded-full flex items-center justify-center'>
                    <Bell className='h-5 w-5 text-tawakal-gold' />
                  </div>
                  <div>
                    <h3 className='font-semibold text-tawakal-gold'>
                      Results Notifications
                    </h3>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>
                      Get notified when polls you voted on end
                    </p>
                  </div>
                </div>
                <Switch
                  checked={notifPrefs?.results_notification || false}
                  disabled
                  className='data-[state=checked]:bg-tawakal-gold'
                />
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button className='bg-tawakal-green hover:bg-tawakal-green/90 h-12 text-base px-8'>
                Save Preferences
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value='security' className='space-y-6'>
          <div>
            <h2 className='text-2xl font-bold text-tawakal-red mb-6'>
              Security Settings
            </h2>

            <div className='space-y-6'>
              <div>
                <Label className='text-base font-medium mb-3 block'>
                  Current Password
                </Label>
                <div className='relative'>
                  <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-red/60' />
                  <Input
                    className='pl-10 h-12 text-base border-tawakal-red/20 focus:border-tawakal-red'
                    type='password'
                    placeholder='••••••••'
                  />
                </div>
              </div>

              <div className='grid gap-6 md:grid-cols-2'>
                <div>
                  <Label className='text-base font-medium mb-3 block'>
                    New Password
                  </Label>
                  <div className='relative'>
                    <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-red/60' />
                    <Input
                      className='pl-10 h-12 text-base border-tawakal-red/20 focus:border-tawakal-red'
                      type='password'
                      placeholder='••••••••'
                    />
                  </div>
                </div>

                <div>
                  <Label className='text-base font-medium mb-3 block'>
                    Confirm Password
                  </Label>
                  <div className='relative'>
                    <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-tawakal-red/60' />
                    <Input
                      className='pl-10 h-12 text-base border-tawakal-red/20 focus:border-tawakal-red'
                      type='password'
                      placeholder='••••••••'
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className='flex justify-end pt-4'>
              <Button className='bg-tawakal-red hover:bg-tawakal-red/90 h-12 text-base px-8'>
                Change Password
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
