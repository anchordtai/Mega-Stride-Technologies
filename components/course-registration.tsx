import EnquiryForm from "./enquiry-form";
export default function CourseRegistration({
  available = false,
  service = "Technology training",
}: {
  available?: boolean;
  service?: string;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr]">
      <aside className="platform-panel">
        <p className="section-kicker">Mega Stride Academy</p>
        <h2 className="mt-4 text-3xl font-bold">Plan your learning pathway.</h2>
        <p className="mt-5 leading-7 text-slate-600">
          Tell us your goals and preferred course. The Academy team will confirm
          availability, schedule, fees and enrolment requirements.
        </p>
        <p className="mt-5 leading-7 text-slate-600">
          Submitting an enquiry does not create an enrolment or confirm payment.
          Payment collection will open after official course and settlement
          details are confirmed.
        </p>
        <p className="mt-5 text-sm leading-6">
          Independent professional training. Manufacturer authorisation or
          accreditation is stated only when verified.
        </p>
      </aside>
      <EnquiryForm kind="training" service={service} available={available} />
    </div>
  );
}
