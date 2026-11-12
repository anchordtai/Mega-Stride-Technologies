"use server";
import { requireTeachingCourse } from "@/lib/teaching";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireStaff } from "@/lib/staff";
import { intakeDatabase } from "@/lib/supabase/server";
export async function saveAssessment(f: FormData) {
  const course = z.uuid().parse(f.get("course"));
  await requireTeachingCourse(course);
  const questions = z
    .array(
      z
        .object({
          prompt: z.string().trim().min(3).max(1000),
          options: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
          answer: z.number().int().min(0).max(5),
        })
        .refine((q) => q.answer < q.options.length),
    )
    .min(1)
    .max(50)
    .parse(JSON.parse(String(f.get("questions"))));
  const { error } = await intakeDatabase().rpc("save_assessment", {
    p_course: course,
    p_title: z.string().trim().min(2).max(180).parse(f.get("title")),
    p_questions: questions.map(({ prompt, options }) => ({ prompt, options })),
    p_answers: questions.map((q) => q.answer),
    p_pass: z.coerce
      .number()
      .int()
      .min(1)
      .max(100)
      .parse(f.get("pass_percent")),
    p_attempts: z.coerce
      .number()
      .int()
      .min(1)
      .max(10)
      .parse(f.get("max_attempts")),
    p_published: f.get("published") === "on",
  });
  if (error) throw Error("Assessment could not be saved");
  revalidatePath("/admin/learning");
}
export async function editCourse(f: FormData) {
  const i = await requireStaff(["admin"]);
  const id = z.uuid().parse(f.get("id"));
  const text = (key: string, max: number, min = 0) =>
    z
      .string()
      .trim()
      .min(min)
      .max(max)
      .parse(f.get(key) || "");
  const raw = String(f.get("price_minor") || "");
  const { error } = await i.db
    .from("courses")
    .update({
      title: text("title", 180, 2),
      description: text("description", 15000, 2),
      category: text("category", 100),
      duration_text: text("duration_text", 120),
      objectives: text("objectives", 5000),
      prerequisites: text("prerequisites", 5000),
      status: z.enum(["draft", "published", "archived"]).parse(f.get("status")),
      price_minor:
        raw === ""
          ? null
          : z.coerce.number().int().min(0).max(1000000000).parse(raw),
      currency: "NGN",
      instructor_id: String(f.get("instructor_id") || "")
        ? z.uuid().parse(f.get("instructor_id"))
        : null,
    })
    .eq("id", id);
  if (error) throw Error("Course could not be saved");
  revalidatePath("/academy", "layout");
  revalidatePath("/admin/learning");
}
export async function editLesson(f: FormData) {
  const i = await requireStaff(["admin", "instructor"]);
  const { error } = await i.db
    .from("lessons")
    .update({
      title: z.string().trim().min(2).max(180).parse(f.get("title")),
      body: z.string().trim().min(2).max(50000).parse(f.get("body")),
      position: z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(f.get("position")),
      published: f.get("published") === "on",
    })
    .eq("id", z.uuid().parse(f.get("id")));
  if (error) throw Error("Lesson could not be saved");
  revalidatePath("/admin/learning");
  revalidatePath("/academy/learn", "layout");
}
export async function updateTicket(f: FormData) {
  const i = await requireStaff(["admin", "staff"]);
  const { error } = await i.db
    .from("support_tickets")
    .update({
      status: z
        .enum(["open", "in_progress", "resolved"])
        .parse(f.get("status")),
    })
    .eq("id", z.uuid().parse(f.get("id")));
  if (error) throw Error("Request status could not be saved");
  revalidatePath("/admin/learning");
  revalidatePath("/academy/support");
}
export async function certificateStatus(f: FormData) {
  await requireStaff(["admin"]);
  const { error } = await intakeDatabase()
    .from("certificates")
    .update({
      revoked_at: f.get("restore") === "yes" ? null : new Date().toISOString(),
    })
    .eq("id", z.uuid().parse(f.get("id")));
  if (error) throw Error("Certificate status could not be saved");
  revalidatePath("/admin/learning");
}
