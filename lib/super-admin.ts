import "server-only";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/staff";
export async function requireSuperAdmin(){
 const i=await requireStaff(["admin"]);
 if(!i.isSuperAdmin) redirect("/admin");
 return i;
}
