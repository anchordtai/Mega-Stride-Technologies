import PageShell from "@/components/page-shell";
import { pageMetadata } from "@/lib/seo";
export const metadata = pageMetadata(
  "Academy Enrolment Terms",
  "Draft training, enrolment and payment terms for Mega Stride Academy.",
  "/academy/terms",
);
export default function Terms() {
  return (
    <PageShell
      eyebrow="Academy terms · draft for management review"
      title="A clear foundation for learning."
    >
      <article className="platform-panel max-w-4xl space-y-6 leading-8">
        <p>
          Final enrolment and refund terms must be approved and supplied before
          accepting course payments.
        </p>
        <h2 className="text-xl font-bold">Enrolment and access</h2>
        <p>
          Training enquiries do not create enrolments. Course access requires a
          confirmed account and an authorised Academy enrolment. Course
          description, instructor, schedule, delivery format, fees and any
          prerequisites must be confirmed before acceptance.
        </p>
        <h2 className="text-xl font-bold">Payments and refunds</h2>
        <p>
          Live online payment collection is inactive in this development
          version. Approved settlement instructions, cancellation deadlines,
          rescheduling arrangements and refund eligibility must be confirmed
          before fees are collected. Never rely solely on a browser
          payment-success message as proof of settlement.
        </p>
        <h2 className="text-xl font-bold">Learning records and certificates</h2>
        <p>
          Lesson completion is a learner acknowledgement and does not itself
          demonstrate assessment competence. Completion certificates, where
          offered, are issued only under the Academy's confirmed assessment and
          award requirements. Independent training does not imply manufacturer
          accreditation or manufacturer certification.
        </p>
        <h2 className="text-xl font-bold">Support</h2>
        <p>
          For enrolment, learning access or payment questions, contact
          info@megastride.com.ng.
        </p>
      </article>
    </PageShell>
  );
}
