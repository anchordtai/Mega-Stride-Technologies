"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { requireStaff } from "@/lib/staff";
import { quotationTotal } from "@/lib/quotation";
const uuid = z.uuid();
const text = (f: FormData, key: string, max: number, min = 0) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .parse(String(f.get(key) || ""));
export async function manageEnquiry(f: FormData) {
  const i = await requireStaff(["admin", "staff"]);
  const id = uuid.parse(f.get("id"));
  const status = z
    .enum([
      "new",
      "under_review",
      "contacted",
      "quotation_sent",
      "negotiation",
      "won",
      "lost",
      "closed",
    ])
    .parse(f.get("status"));
  const assigned = text(f, "assigned_to", 36);
  const follow = text(f, "follow_up_at", 40);
  if (assigned) uuid.parse(assigned);
  if (follow && !z.iso.datetime().safeParse(follow).success)
    throw Error("Use an ISO follow-up date including timezone.");
  const { error } = await i.db
    .from("enquiries")
    .update({
      status,
      assigned_to: assigned || null,
      follow_up_at: follow || null,
    })
    .eq("id", id);
  if (error) throw Error("Enquiry could not be updated.");
  const note = text(f, "note", 5000);
  if (note) {
    const result = await i.db
      .from("enquiry_notes")
      .insert({ enquiry_id: id, body: note, author_id: i.user.id });
    if (result.error) throw Error("The note could not be saved.");
  }
  revalidatePath("/admin");
}
export async function saveContent(f: FormData) {
  const i = await requireStaff(["admin", "editor"]);
  const id = String(f.get("id") || "");
  if (id) uuid.parse(id);
  const data = {
    kind: z
      .enum(["page", "project", "post", "team", "testimonial", "service"])
      .parse(f.get("kind")),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .max(120)
      .parse(f.get("slug")),
    title: text(f, "title", 180, 2),
    summary: text(f, "summary", 500),
    body: text(f, "body", 50000, 2),
    category: text(f, "category", 100),
    status: z.enum(["draft", "published", "archived"]).parse(f.get("status")),
  };
  const result = id
    ? await i.db.from("content").update(data).eq("id", id)
    : await i.db.from("content").insert({ ...data, created_by: i.user.id });
  if (result.error)
    throw Error("Content could not be saved. Check the unique slug.");
  revalidatePath("/admin");
  revalidatePath("/projects", "layout");
  revalidatePath("/insights", "layout");
}
export async function saveCourse(f: FormData) {
  const i = await requireStaff(["admin", "instructor"]);
  const id = String(f.get("id") || "");
  if (id) uuid.parse(id);
  const data = {
    slug: z
      .string()
      .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/)
      .max(120)
      .parse(f.get("slug")),
    title: text(f, "title", 180, 2),
    description: text(f, "description", 15000, 2),
    category: text(f, "category", 100),
    status: z.enum(["draft", "published", "archived"]).parse(f.get("status")),
    price_minor: f.get("price_minor")
      ? z.coerce
          .number()
          .int()
          .min(0)
          .max(1000000000)
          .parse(f.get("price_minor"))
      : null,
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .parse(f.get("currency") || "NGN"),
  };
  const result = id
    ? await i.db.from("courses").update(data).eq("id", id)
    : await i.db.from("courses").insert(data);
  if (result.error) throw Error("Course could not be saved.");
  revalidatePath("/admin");
  revalidatePath("/academy", "layout");
}
export async function saveLesson(f: FormData) {
  const i = await requireStaff(["admin", "instructor"]);
  const course = uuid.parse(f.get("course_id"));
  const { error } = await i.db
    .from("lessons")
    .insert({
      course_id: course,
      title: text(f, "title", 180, 2),
      body: text(f, "body", 50000, 2),
      position: z.coerce
        .number()
        .int()
        .min(0)
        .max(10000)
        .parse(f.get("position")),
      published: f.get("published") === "on",
    });
  if (error)
    throw Error(
      "Lesson could not be saved. Choose a unique position in this course.",
    );
  revalidatePath("/admin");
  revalidatePath(`/academy/learn/${course}`);
}
export async function setEnrolment(f: FormData) {
  const i = await requireStaff(["admin", "staff"]);
  const { error } = await i.db
    .from("enrolments")
    .upsert(
      {
        user_id: uuid.parse(f.get("user_id")),
        course_id: uuid.parse(f.get("course_id")),
        status: z
          .enum(["pending", "active", "completed", "cancelled"])
          .parse(f.get("status")),
      },
      { onConflict: "user_id,course_id" },
    );
  if (error)
    throw Error(
      "Enrolment could not be saved. Confirm the user and course IDs.",
    );
  revalidatePath("/admin");
}
export async function uploadResource(f: FormData) {
  const i = await requireStaff(["admin", "instructor"]);
  const lessonId = uuid.parse(f.get("lesson_id"));
  const { data: lesson } = await i.db
    .from("lessons")
    .select("course_id")
    .eq("id", lessonId)
    .single();
  if (!lesson) throw Error("Lesson unavailable.");
  const resourceTitle=text(f,"title",180,1);
  const file = f.get("file");
  if (
    !(file instanceof File) ||
    file.type !== "application/pdf" ||
    file.size < 5 ||
    file.size > 3 * 1024 * 1024
  )
    throw Error("Upload a PDF smaller than 3 MiB.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (new TextDecoder().decode(bytes.slice(0, 5)) !== "%PDF-")
    throw Error("The file is not a PDF.");
  const path = `${lesson.course_id}/${lessonId}/${randomUUID()}.pdf`;
  const uploaded = await i.db.storage
    .from("academy-resources")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (uploaded.error) throw Error("Upload failed.");
  const saved = await i.db
    .from("resources")
    .insert({
      lesson_id: lessonId,
      title: resourceTitle,
      object_path: path,
    });
  if (saved.error) {
    await i.db.storage.from("academy-resources").remove([path]);
    throw Error("The resource could not be catalogued.");
  }
  revalidatePath("/admin");
}
export async function saveQuote(f: FormData) {
  const i = await requireStaff(["admin", "staff"]);
  const { items, total } = quotationTotal(
    JSON.parse(text(f, "items", 25000, 2)),
  );
  const { error } = await i.db.from("quotations").insert({
    enquiry_id: uuid.parse(f.get("enquiry_id")),
    items,
    total_minor: total,
    currency: z
      .string()
      .regex(/^[A-Z]{3}$/)
      .parse(f.get("currency")),
    valid_until: z.iso.date().parse(f.get("valid_until")),
  });
  if (error) throw Error("Quotation could not be saved.");
  revalidatePath("/admin");
}
export async function approveQuote(f: FormData) {
  const i = await requireStaff(["admin"]);
  const { error } = await i.db
    .from("quotations")
    .update({ status: "approved" })
    .eq("id", uuid.parse(f.get("id")))
    .eq("status", "draft");
  if (error) throw Error("Quotation could not be approved.");
  revalidatePath("/admin");
}
