"use server";
import { currentIdentity } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function completeLesson(form: FormData) {
  const i = await currentIdentity();
  if (!i) throw Error("Sign in first.");
  const lesson = String(form.get("lesson"));
  const course = String(form.get("course"));
  if (!/^[0-9a-f-]{36}$/i.test(lesson) || !/^[0-9a-f-]{36}$/i.test(course))
    throw Error("Invalid lesson.");
  const { error } = await i.db
    .from("lesson_progress")
    .insert({ user_id: i.user.id, lesson_id: lesson });
  if (error && error.code !== "23505")
    throw Error("Completion could not be recorded.");
  revalidatePath(`/academy/learn/${course}`);
}
