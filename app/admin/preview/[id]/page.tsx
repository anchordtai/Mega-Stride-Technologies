import { notFound } from "next/navigation";
import PageShell from "@/components/page-shell";
import { requireStaff } from "@/lib/staff";
export const metadata = {
  title: "Publication preview",
  robots: { index: false, follow: false },
};
export default async function Preview({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const i = await requireStaff(["admin", "editor"]);
  const { id } = await params;
  const { data } = await i.db.from("content").select("*").eq("id", id).single();
  if (!data) notFound();
  return (
    <PageShell
      eyebrow={`Private preview · ${data.status}`}
      title={data.title}
      intro={data.summary}
    >
      <p className="platform-panel whitespace-pre-wrap text-lg leading-9">
        {data.body}
      </p>
      <a href="/admin#publishing" className="primary-button mt-8">
        Back to publishing
      </a>
    </PageShell>
  );
}
