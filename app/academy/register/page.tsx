import PageShell from "@/components/page-shell";
import CourseRegistration from "@/components/course-registration";
import { intakeReady } from "@/lib/supabase/config";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Academy Training Enquiry",
  "Discuss your learning goals, preferred course and training requirements with Mega Stride Academy.",
  "/academy/register",
);
export default async function Registration({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  return (
    <PageShell
      image="/images/editorial/academy.webp"
      eyebrow="Mega Stride Academy"
      title="Your next stride starts with a conversation."
      intro="Choose a pathway and tell us what you want to achieve."
    >
      <CourseRegistration
        service={course?.slice(0, 120) || "Technology training"}
        available={intakeReady()}
      />
    </PageShell>
  );
}
