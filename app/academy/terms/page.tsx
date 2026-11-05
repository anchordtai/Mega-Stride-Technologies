import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Academy Enrolment Information",
  "Training enquiries, learner access and enrolment arrangements for Mega Stride Academy.",
  "/academy/terms",
);
export default function Terms() {
  return (
    <PageShell
      eyebrow="Academy enrolment information"
      title="A clear foundation for learning."
    >
      <article className="platform-panel max-w-4xl space-y-6 leading-8">
        <section>
          <h2 className="text-xl font-bold">Enquiries and enrolment</h2>
          <p>
            A training enquiry does not create an enrolment. The Academy
            confirms course availability, instructor, prerequisites, schedule,
            format and fees before enrolment. Learner access is arranged after
            enrolment requirements are confirmed.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Fees and cancellations</h2>
          <p>
            Use online checkout only when it is offered for a published course.
            Test checkout does not collect real money or grant course access.
            Obtain official payment instructions and the applicable
            cancellation, rescheduling and refund terms in writing before paying
            for a course.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Learning records and awards</h2>
          <p>
            Marking a lesson complete records a learner acknowledgement; it does
            not demonstrate assessed competence. Completion certificates require
            all published lessons and a passed current course assessment. The
            name comes from the learner profile. Independent professional
            training does not imply manufacturer accreditation or manufacturer
            certification.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold">Support</h2>
          <p>
            For training, enrolment or account-access questions, contact{" "}
            <a href="mailto:info@megastride.com.ng" className="underline">
              info@megastride.com.ng
            </a>
            .
          </p>
        </section>
      </article>
    </PageShell>
  );
}
