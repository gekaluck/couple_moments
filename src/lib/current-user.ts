import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/session";

export async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect("/login");
  }
  return userId;
}
