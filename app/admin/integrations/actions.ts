"use server";
import { requireStaff } from "@/lib/staff";
import { deliverNotifications } from "@/lib/notifications";
import { revalidatePath } from "next/cache";
export async function retryEmails() {
  await requireStaff(["admin", "staff"]);
  const result = await deliverNotifications();
  if (!result.configured)
    throw Error(
      "Verify the company email sender and configure its server credentials first",
    );
  revalidatePath("/admin/integrations");
}
