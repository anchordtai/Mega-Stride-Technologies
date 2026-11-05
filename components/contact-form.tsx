import EnquiryForm from "./enquiry-form";
export default function ContactForm({
  available = false,
}: {
  available?: boolean;
}) {
  return <EnquiryForm available={available} />;
}
