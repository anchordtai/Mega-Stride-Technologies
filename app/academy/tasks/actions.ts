"use server";
import { z } from "zod";
import { redirect } from "next/navigation";
import { requireLearner } from "@/lib/academy";
import { intakeDatabase } from "@/lib/supabase/server";
export async function submitPractical(f: FormData) {
  const i = await requireLearner();
  const task = z.uuid().parse(f.get("task"));
  const body = z.string().trim().min(20).max(30000).parse(f.get("body"));
  const { error } = await intakeDatabase().rpc("submit_academy_task", {
    p_user: i.user.id,
    p_task: task,
    p_body: body,
  });
  if (error)
    throw Error(
      "Submission could not be saved. Check course access or contact your instructor about the attempt limit.",
    );
  redirect(`/academy/tasks/${task}?saved=1`);
}
