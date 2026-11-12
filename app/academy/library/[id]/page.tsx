import { notFound } from "next/navigation";
import AcademicText from "@/components/academic-text";
import PageShell from "@/components/page-shell";
import { requireLearner } from "@/lib/academy";
export const metadata = {
  title: "Course learning material",
  robots: { index: false, follow: false },
};
export default async function Material({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const i = await requireLearner();
  const { id } = await params;
  const { data: d, error } = await i.db
    .from("academic_documents")
    .select("title,body,course_id,kind,version")
    .eq("id", id)
    .eq("audience", "student")
    .eq("status", "approved")
    .maybeSingle();
  if (error) throw Error("Learning material unavailable.");
  if (!d) notFound();
  const { data: access } = await i.db.rpc("my_learning_access", {
    p_course: d.course_id,
  });
  if (!access) notFound();
  return (
    <PageShell
      eyebrow="Academic library"
      title={d.title}
      intro={`${d.kind} · Approved learning material · Version ${d.version}`}
    >
      <a className="text-link" href={`/academy/learn/${d.course_id}`}>
        ← Return to course
      </a>
      <article className="platform-panel mt-8">
        <AcademicText body={d.body} />
      </article>
    </PageShell>
  );
}
