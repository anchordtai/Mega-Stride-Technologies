import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { currentIdentity, intakeDatabase } from "@/lib/supabase/server";
import { databaseReady } from "@/lib/supabase/config";
export type BusinessRole =
  | "super_admin"
  | "admin"
  | "sales"
  | "finance"
  | "management";
export const businessIdentity = cache(async function businessIdentity() {
  if (!databaseReady()) return null;
  const i = await currentIdentity();
  if (!i || !i.user.email_confirmed_at) return null;
  const { data, error } = await i.db.rpc("my_business_role");
  return { ...i, businessRole: (!error ? data : null) as BusinessRole | null };
});
export async function requireBusiness(
  roles: BusinessRole[] = [
    "super_admin",
    "admin",
    "sales",
    "finance",
    "management",
  ],
) {
  const i = await businessIdentity();
  if (!i) redirect("/account?next=%2Fbusiness-desk");
  if (!i.businessRole || !roles.includes(i.businessRole))
    redirect("/client-portal?notice=staff-access");
  return { ...i, businessRole: i.businessRole };
}
export async function businessCommand(
  actor: string,
  action: string,
  p: Record<string, unknown>,
) {
  const { data, error } = await intakeDatabase().rpc("msbd_command", {
    p_actor: actor,
    p_action: action,
    p,
  });
  if (error)
    throw Error(
      "The change could not be saved. Check your permissions, document status, duplicate reference and entered values.",
    );
  return data as { id?: string; receipt_id?: string; status?: string };
}
export type BusinessItem = {
  description: string;
  quantity_milli: number;
  unit_minor: number;
  discount_minor: number;
  total_minor: number;
};
export type BusinessContent = {
  title: string;
  currency: string;
  items: BusinessItem[];
  subtotal_minor: number;
  line_discount_minor?: number;
  discount_minor?: number;
  tax_bps?: number;
  tax_minor?: number;
  charges_minor?: number;
  delivery_minor?: number;
  total_minor: number;
  terms?: string;
  category?: string;
  schedule?: { label: string; amount_minor: number; due_date: string }[];
  payment_reference?: string;
  payment_method?: string;
  payment_date?: string;
  invoice_number?: string;
  outstanding_minor?: number;
};
export type BusinessDocument = {
  id: string;
  number: string;
  kind: string;
  client_id: string;
  source_id: string | null;
  revision: number;
  token: string;
  status: string;
  content: BusinessContent;
  company_snapshot: Record<string, unknown> | null;
  client_snapshot: {
    name: string;
    email: string;
    number: string;
    profile: Record<string, string>;
  } | null;
  content_hash: string | null;
  issued_at: string | null;
  due_date: string | null;
  created_at: string;
  created_by: string;
  pdf_path: string | null;
  pdf_sha256: string | null;
  acceptance: Record<string, unknown> | null;
};
export type BusinessClient = {
  id: string;
  number: string;
  name: string;
  email: string;
  kind: string;
  profile: Record<string, string>;
  assigned_to: string | null;
  portal_user: string | null;
  archived: boolean;
  created_at: string;
};
export type BusinessPayment = {
  id: string;
  invoice_id: string;
  client_id: string;
  reference: string;
  amount_minor: number;
  refunded_minor?: number;
  currency: string;
  method: string;
  provider: string;
  payment_date: string;
  status: string;
  evidence: string;
  recorded_by: string;
  receipt_id: string | null;
  confirmed_at: string | null;
  created_at: string;
};
export function invoiceBalance(
  d: BusinessDocument,
  payments: BusinessPayment[],
  documents: BusinessDocument[],
) {
  const paid = payments
    .filter((p) => p.invoice_id === d.id && p.status === "confirmed")
    .reduce((n, p) => n + p.amount_minor - (p.refunded_minor || 0), 0);
  const credit = documents
    .filter(
      (c) =>
        c.source_id === d.id &&
        c.kind === "credit_note" &&
        c.issued_at &&
        c.status !== "cancelled",
    )
    .reduce((n, c) => n + c.content.total_minor, 0);
  return { paid, credit, outstanding: d.content.total_minor - paid - credit };
}
export function documentStatus(
  d: BusinessDocument,
  payments: BusinessPayment[],
  documents: BusinessDocument[],
) {
  if (
    ["cancelled", "written_off", "superseded"].includes(d.status) ||
    !d.issued_at
  )
    return d.status;
  const overdue =
    d.due_date && d.due_date < new Date().toISOString().slice(0, 10);
  if (
    d.kind === "quotation" &&
    ["issued", "sent", "viewed"].includes(d.status) &&
    overdue
  )
    return "expired";
  if (d.kind === "invoice") {
    const b = invoiceBalance(d, payments, documents);
    return b.outstanding === 0
      ? "paid"
      : b.paid > 0
        ? "partially_paid"
        : overdue
          ? "overdue"
          : "unpaid";
  }
  return d.status;
}
