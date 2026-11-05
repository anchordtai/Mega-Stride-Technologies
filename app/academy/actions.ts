"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireLearner } from "@/lib/academy";
import { intakeDatabase } from "@/lib/supabase/server";
export async function updateProfile(f: FormData) {
  const i = await requireLearner();
  const values = z
    .object({
      display_name: z.string().trim().min(2).max(120),
      phone: z.string().trim().max(40),
    })
    .parse({
      display_name: f.get("display_name"),
      phone: f.get("phone") || "",
    });
  const { error } = await i.db
    .from("profiles")
    .upsert({ id: i.user.id, ...values });
  if (error) throw Error("Profile could not be saved");
  redirect("/academy/profile?saved=1");
}
export async function submitAssessment(f: FormData) {
  const i = await requireLearner();
  const id = z.uuid().parse(f.get("id"));
  const version = z.coerce.number().int().min(1).parse(f.get("version"));
  const count = z.coerce.number().int().min(1).max(50).parse(f.get("count"));
  const answers = Array.from({ length: count }, (_, j) =>
    Number(
      z
        .string()
        .regex(/^[0-5]$/)
        .parse(f.get("answer_" + j)),
    ),
  );
  const { error } = await intakeDatabase().rpc("grade_assessment", {
    p_user: i.user.id,
    p_assessment: id,
    p_version: version,
    p_answers: answers,
  });
  if (error) redirect(`/academy/assessments/${id}?notice=review`);
  revalidatePath("/academy/dashboard");
  redirect(`/academy/assessments/${id}?notice=result`);
}
export async function requestCertificate(f: FormData) {
  const i = await requireLearner();
  const course = z.uuid().parse(f.get("course"));
  if (f.get("confirm") !== "on")
    throw Error("Confirm the certificate name first");
  const { data, error } = await intakeDatabase().rpc("issue_certificate", {
    p_user: i.user.id,
    p_course: course,
  });
  if (error) redirect(`/academy/learn/${course}?notice=certificate`);
  revalidatePath("/academy/dashboard");
  redirect(`/academy/certificates/${data}`);
}
export async function enrolFree(f: FormData) {
  const i = await requireLearner();
  const course = z.uuid().parse(f.get("course"));
  const { error } = await intakeDatabase().rpc("enrol_free_course", {
    p_user: i.user.id,
    p_course: course,
  });
  if (error) throw Error("Free enrolment unavailable. Contact the Academy.");
  redirect(`/academy/learn/${course}`);
}
export async function createTicket(f: FormData) {
  const i = await requireLearner();
  const values = z
    .object({
      subject: z.string().trim().min(3).max(180),
      body: z.string().trim().min(10).max(5000),
    })
    .parse({ subject: f.get("subject"), body: f.get("body") });
  const { error } = await intakeDatabase().rpc("create_support_ticket", {
    p_user: i.user.id,
    p_subject: values.subject,
    p_body: values.body,
  });
  if (error)
    throw Error(
      "Support request could not be saved. Please wait before opening another request.",
    );
  revalidatePath("/academy/support");
  redirect("/academy/support?saved=1");
}
export async function replyTicket(f: FormData) {
  const i = await requireLearner();
  const ticket = z.uuid().parse(f.get("ticket"));
  const body = z.string().trim().min(2).max(5000).parse(f.get("body"));
  const { data: t } = await i.db
    .from("support_tickets")
    .select("id")
    .eq("id", ticket)
    .maybeSingle();
  if (!t) throw Error("Request unavailable");
  const { error } = await i.db
    .from("support_replies")
    .insert({ ticket_id: ticket, author_id: i.user.id, body });
  if (error) throw Error("Reply could not be saved");
  revalidatePath("/academy/support");
  revalidatePath("/admin/learning");
}
