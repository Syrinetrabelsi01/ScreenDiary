import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RandomPickerClient } from "./RandomPickerClient";

export default async function RandomPickerPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <RandomPickerClient />;
}
