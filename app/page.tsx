import { redirect } from "next/navigation";

export default function HomePage() {
  // Simply redirect to the appropriate routes
  redirect("/dashboard");
}
