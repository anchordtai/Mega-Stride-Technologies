import "server-only";
import { notFound } from "next/navigation";
import { requireStaff } from "./staff";
export async function requireTeachingCourse(course: string) {
  const i = await requireStaff(["admin", "instructor"]);
  const { data, error } = await i.db
    .from("courses")
    .select("id,title,instructor_id")
    .eq("id", course)
    .maybeSingle();
  if (
    error ||
    !data ||
    (i.role !== "admin" && data.instructor_id !== i.user.id)
  )
    notFound();
  return { ...i, course: data };
}
