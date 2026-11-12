"use server";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireTeachingCourse } from "@/lib/teaching";
import { intakeDatabase } from "@/lib/supabase/server";
import { requireStaff } from "@/lib/staff";
export async function saveAcademicDocument(f: FormData) {
  const course = z.uuid().parse(f.get("course"));
  const i = await requireTeachingCourse(course);
  const values = {
    title: z.string().trim().min(2).max(180).parse(f.get("title")),
    body: z.string().trim().min(20).max(200000).parse(f.get("body")),
    status: z.enum(["draft", "review", "approved"]).parse(f.get("status")),
  };
  if (values.status === "approved" && i.role !== "admin")
    throw Error("An administrator must approve academic material.");
  const { error } = await i.db
    .from("academic_documents")
    .update(values)
    .eq("id", z.uuid().parse(f.get("id")))
    .eq("course_id", course);
  if (error)
    throw Error(
      "This material could not be saved. Approved material requires administrator review.",
    );
  revalidatePath("/instructor");
}
export async function gradePractical(f: FormData) {
  const course = z.uuid().parse(f.get("course"));
  const i = await requireTeachingCourse(course);
  const submission = z.uuid().parse(f.get("submission"));
  const { data } = await i.db
    .from("academy_submissions")
    .select("id,academy_tasks!inner(course_id)")
    .eq("id", submission)
    .eq("academy_tasks.course_id", course)
    .maybeSingle();
  if (!data) throw Error("Submission unavailable.");
  const { error } = await intakeDatabase().rpc("grade_academy_task", {
    p_actor: i.user.id,
    p_submission: submission,
    p_score: z.coerce.number().int().min(0).max(1000).parse(f.get("score")),
    p_feedback: z.string().trim().min(10).max(5000).parse(f.get("feedback")),
  });
  if (error)
    throw Error(
      "Grading could not be saved. Check the permitted mark range and task version.",
    );
  revalidatePath("/instructor");
  revalidatePath("/academy/tasks", "layout");
}
export async function savePracticalTask(f: FormData) {
  const course = z.uuid().parse(f.get("course"));
  const i = await requireTeachingCourse(course);
  const max = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .parse(f.get("max_marks"));
  const pass = z.coerce
    .number()
    .int()
    .min(1)
    .max(max)
    .parse(f.get("pass_marks"));
  const published = f.get("published") === "on";
  if (published && i.role !== "admin")
    throw Error("An administrator must approve publication.");
  const { error } = await i.db.from("academy_tasks").insert({
    course_id: course,
    title: z.string().trim().min(2).max(180).parse(f.get("title")),
    kind: z
      .enum(["lab", "assignment", "project", "short_answer"])
      .parse(f.get("kind")),
    instructions: z
      .string()
      .trim()
      .min(20)
      .max(20000)
      .parse(f.get("instructions")),
    max_marks: max,
    pass_marks: pass,
    required: true,
    published,
  });
  if (error) throw Error("Task could not be saved.");
  revalidatePath("/instructor");
}
export async function learningOverride(f: FormData) {
  const i = await requireStaff(["admin"]);
  const { error } = await intakeDatabase().rpc("set_learning_override", {
    p_actor: i.user.id,
    p_user: z.uuid().parse(f.get("user")),
    p_course: z.uuid().parse(f.get("course")),
    p_reason: z.string().trim().min(20).max(2000).parse(f.get("reason")),
    p_revoke: f.get("revoke") === "on",
  });
  if (error) throw Error("Override could not be recorded.");
  revalidatePath("/instructor");
}

export async function addAcademicDocument(f: FormData) {
  const course = z.uuid().parse(f.get("course"));
  const i = await requireTeachingCourse(course);
  const kind = z
    .enum([
      "lecture",
      "lab",
      "question_bank",
      "answer_key",
      "lesson_plan",
      "project",
    ])
    .parse(f.get("kind"));
  const audience =
    kind === "answer_key"
      ? "instructor"
      : z.enum(["student", "instructor"]).parse(f.get("audience"));
  const { error } = await i.db
    .from("academic_documents")
    .insert({
      course_id: course,
      title: z.string().trim().min(2).max(180).parse(f.get("title")),
      kind,
      audience,
      body: z.string().trim().min(20).max(200000).parse(f.get("body")),
      status: "draft",
    });
  if (error) throw Error("Academic draft could not be created.");
  revalidatePath("/instructor");
}
