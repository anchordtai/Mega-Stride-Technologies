export function emailContent(kind: string, payload: Record<string, unknown>) {
  const ref = String(payload.reference || "");
  switch (kind) {
    case "enquiry_ack":
      return {
        subject: `We received your enquiry · ${ref}`,
        text: `Hello ${String(payload.name || "")},\n\nThank you for contacting Mega Stride Technologies Limited. Your enquiry has been saved with reference ${ref}. Our team will review your requirements.\n\nPlease keep this reference. You can reach us at info@megastride.com.ng.\n\nMega Stride Technologies Limited\nhttps://www.megastride.com.ng/`,
      };
    case "staff_enquiry":
      return {
        subject: `New Mega Stride enquiry · ${ref}`,
        text: `A new enquiry has been saved: ${ref}.\nSign in to the staff workspace to review the details: https://www.megastride.com.ng/admin\nThis message does not include the customer's private requirements.`,
      };
    case "payment_receipt":
      return {
        subject: `Payment received · ${ref}`,
        text: `Your payment of ${String(payload.currency)} ${(Number(payload.amount_minor) / 100).toFixed(2)} has been verified.\nReference: ${ref}\nSign in to view your receipt and enrolment: https://www.megastride.com.ng/academy/payments\nIf access requires review, contact the Academy and keep this reference.`,
      };
    case "support_reply":
      return {
        subject: "An update to your Mega Stride support request",
        text: "There is an update to your support request. Sign in to read it: https://www.megastride.com.ng/academy/support",
      };
    default:
      throw Error("Unknown message kind");
  }
}
