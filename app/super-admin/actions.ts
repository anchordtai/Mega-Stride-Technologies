"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperAdmin } from "@/lib/super-admin";
import { intakeDatabase } from "@/lib/supabase/server";
const reason=(f:FormData)=>z.string().trim().min(20).max(2000).parse(f.get("reason"));
export async function changeMemberRole(f:FormData){
 const i=await requireSuperAdmin();
 const {error}=await intakeDatabase().rpc("change_academy_role",{p_actor:i.user.id,p_target:z.uuid().parse(f.get("user")),p_role:z.enum(["student","instructor","admin","staff","editor"]).parse(f.get("role")),p_reason:reason(f)});
 if(error)redirect("/super-admin?notice=role-error");
 revalidatePath("/super-admin");revalidatePath("/instructor");redirect("/super-admin?notice=role-saved");
}
export async function assignInstructor(f:FormData){
 const i=await requireSuperAdmin();
 const target=String(f.get("instructor")||"");
 const {error}=await intakeDatabase().rpc("assign_academy_instructor",{p_actor:i.user.id,p_course:z.uuid().parse(f.get("course")),p_target:target?z.uuid().parse(target):null,p_reason:reason(f)});
 if(error)redirect("/super-admin?notice=assignment-error");
 revalidatePath("/super-admin");revalidatePath("/instructor");redirect("/super-admin?notice=assignment-saved");
}
export async function manageEnrolment(f:FormData){
 const i=await requireSuperAdmin();
 const {error}=await intakeDatabase().rpc("manage_academy_enrolment",{p_actor:i.user.id,p_target:z.uuid().parse(f.get("user")),p_course:z.uuid().parse(f.get("course")),p_status:z.enum(["pending","active","completed","cancelled"]).parse(f.get("status")),p_reason:reason(f)});
 if(error)redirect("/super-admin?notice=enrolment-error");
 revalidatePath("/super-admin");revalidatePath("/academy/dashboard");redirect("/super-admin?notice=enrolment-saved");
}
export async function setOwnerTestAccess(f:FormData){
 const i=await requireSuperAdmin();
 const enabled=z.enum(["true","false"]).parse(f.get("enabled"))==="true";
 const {error}=await intakeDatabase().rpc("set_owner_course_test",{p_actor:i.user.id,p_enabled:enabled});
 if(error)redirect("/super-admin?notice=test-error");
 revalidatePath("/academy/dashboard");redirect("/super-admin?notice="+(enabled?"test-enabled":"test-disabled"));
}
