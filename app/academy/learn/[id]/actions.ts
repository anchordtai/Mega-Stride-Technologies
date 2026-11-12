"use server";
import { currentIdentity } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
export async function completeLesson(form: FormData) {
  const i = await currentIdentity();
  if (!i?.user.email_confirmed_at)
    throw Error("Sign in with a verified account.");
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

export async function resumeLesson(form: FormData) {
  const i = await currentIdentity();
  if (!i?.user.email_confirmed_at)
    throw Error("Sign in with a verified account.");
  const course = String(form.get("course")),
    lesson = String(form.get("lesson"));
  if (!/^[0-9a-f-]{36}$/i.test(course) || !/^[0-9a-f-]{36}$/i.test(lesson))
    throw Error("Invalid lesson.");
  const { intakeDatabase } = await import("@/lib/supabase/server");
  const { error } = await intakeDatabase().rpc("save_learning_position", {
    p_user: i.user.id,
    p_course: course,
    p_lesson: lesson,
  });
  if (error) throw Error("Your learning position could not be saved.");
  revalidatePath(`/academy/learn/${course}`);
}
