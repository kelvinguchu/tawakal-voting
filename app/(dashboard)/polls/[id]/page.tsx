import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PollDetail } from "@/components/polls/poll-detail";
import { Metadata } from "next";

interface PollPageProps {
  params: {
    id: string;
  };
}

export default async function PollPage({ params }: PollPageProps) {
  const supabase = await createClient();

  // Check if the user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user data
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!userData) {
    redirect("/login");
  }

  return (
    <div className='min-h-[95vh] w-full max-w-full p-6'>
      <PollDetail pollId={params.id} userId={user.id} />
    </div>
  );
}
