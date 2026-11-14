"use server";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { businessCommand, requireBusiness } from "@/lib/business-desk/server";
import { minorAmount, quantityMilli } from "@/lib/business-desk/money";
const id = z.uuid();
const text = (f: FormData, k: string, max = 2000, min = 0) =>
  z
    .string()
    .trim()
    .min(min)
    .max(max)
    .parse(f.get(k) || "");
const optionalId = (f: FormData, k: string) =>
  f.get(k) ? id.parse(f.get(k)) : null;
export async function changeBusiness(f: FormData) {
  const i = await requireBusiness();
  const action = z
    .enum([
      "client_save",
      "client_archive",
      "client_portal",
      "service_save",
      "document_save",
      "document_revise",
      "quotation_convert",
      "submit",
      "approve",
      "return_draft",
      "issue",
      "cancel",
      "write_off",
      "document_email",
      "payment_record",
      "payment_confirm",
      "payment_reject",
      "payment_reverse",
      "credit_note",
      "settings",
      "role",
      "template_save",
      "enquiry_claim",
      "statement",
      "request_convert",
    ])
    .parse(f.get("action"));
  let p: Record<string, unknown> = {};
  try {
    p = { id: optionalId(f, "id"), reason: text(f, "reason") };
    if (action === "client_save") {
      const profile: Record<string, string> = {};
      for (const key of [
        "contact",
        "department",
        "phone",
        "alternative_phone",
        "address",
        "delivery_address",
        "city",
        "state",
        "country",
        "registration",
        "tax_id",
        "website",
        "category",
      ])
        profile[key] = text(f, key, key.includes("address") ? 1500 : 200);
      p = {
        ...p,
        name: text(f, "name", 180, 2),
        email: z
          .email()
          .max(254)
          .parse(text(f, "email", 254).toLowerCase()),
        kind: z.enum(["individual", "corporate"]).parse(f.get("kind")),
        profile,
        assigned_to: optionalId(f, "assigned_to"),
      };
    } else if (action === "client_portal") {
      p.portal_user = null;
      p.link_matching_email = f.get("portal_action") === "link";
    } else if (action === "service_save")
      p = {
        ...p,
        name: text(f, "name", 180, 2),
        category: text(f, "category", 120),
        description: text(f, "description", 5000),
        unit: text(f, "unit", 40),
        price_minor: f.get("price") ? minorAmount(text(f, "price")) : null,
        currency: z.enum(["NGN", "USD", "GBP", "EUR"]).parse(f.get("currency")),
        pricing: z
          .enum([
            "fixed",
            "hourly",
            "daily",
            "monthly",
            "per_user",
            "per_device",
            "per_project",
            "custom",
          ])
          .parse(f.get("pricing")),
        active: f.get("active") === "on",
      };
    else if (action === "document_save") {
      const entries = z
        .array(
          z.object({
            description: z.string().trim().min(2).max(1000),
            quantity: z.string(),
            price: z.string(),
            discount: z.string().default("0"),
          }),
        )
        .min(1)
        .max(50)
        .parse(JSON.parse(text(f, "items", 100000, 2)));
      const items = entries.map((e) => ({
        description: e.description,
        quantity_milli: quantityMilli(e.quantity),
        unit_minor: minorAmount(e.price),
        discount_minor: minorAmount(e.discount),
      }));
      const schedule = z
        .array(
          z.object({
            label: z.string().min(2).max(180),
            amount: z.string(),
            due_date: z.iso.date(),
          }),
        )
        .max(24)
        .parse(JSON.parse(text(f, "schedule", 12000) || "[]"))
        .map((x) => ({
          label: x.label,
          amount_minor: minorAmount(x.amount, false),
          due_date: x.due_date,
        }));
      p = {
        ...p,
        kind: z.enum(["quotation", "invoice", "order"]).parse(f.get("kind")),
        client_id: id.parse(f.get("client_id")),
        due_date: f.get("due_date")
          ? z.iso.date().parse(f.get("due_date"))
          : null,
        content: {
          title: text(f, "title", 180, 2),
          currency: z
            .enum(["NGN", "USD", "GBP", "EUR"])
            .parse(f.get("currency")),
          items,
          discount_minor: minorAmount(text(f, "discount") || "0"),
          tax_bps: z.coerce
            .number()
            .int()
            .min(0)
            .max(10000)
            .parse(f.get("tax_bps") || 0),
          charges_minor: minorAmount(text(f, "charges") || "0"),
          delivery_minor: minorAmount(text(f, "delivery") || "0"),
          terms: text(f, "terms", 20000),
          category: text(f, "category", 120),
          schedule,
        },
      };
    } else if (["quotation_convert", "document_revise"].includes(action))
      p.due_date = f.get("due_date")
        ? z.iso.date().parse(f.get("due_date"))
        : null;
    else if (action === "payment_record")
      p = {
        ...p,
        invoice_id: id.parse(f.get("invoice_id")),
        reference: text(f, "reference", 180, 3),
        amount_minor: minorAmount(text(f, "amount"), false),
        method: z
          .enum(["bank_transfer", "cash", "pos", "gateway", "other"])
          .parse(f.get("method")),
        provider: text(f, "provider", 120),
        payment_date: z.iso.date().parse(f.get("payment_date")),
        evidence: text(f, "evidence", 2000, 5),
      };
    else if (action === "payment_confirm")
      p.confirmed_received = f.get("confirmed_received") === "on";
    else if (action === "payment_reverse") {
      p.refund_completed = f.get("refund_completed") === "on";
      p.reversal_reference = text(f, "reversal_reference", 180, 3);
      if (f.get("amount"))
        p.amount_minor = minorAmount(text(f, "amount"), false);
    } else if (action === "statement")
      p = {
        ...p,
        client_id: id.parse(f.get("client_id")),
        currency: z.enum(["NGN", "USD", "GBP", "EUR"]).parse(f.get("currency")),
      };
    else if (action === "credit_note") {
      p.invoice_id = id.parse(f.get("invoice_id"));
      p.amount_minor = minorAmount(text(f, "amount"), false);
    } else if (action === "settings") {
      const profile: Record<string, unknown> = {};
      for (const key of [
        "name",
        "trading_name",
        "address",
        "branch_address",
        "phone",
        "email",
        "website",
        "registration",
        "tax_id",
        "vat_registration",
        "bank_details",
        "payment_instructions",
        "signatory",
        "designation",
        "signature_note",
        "quotation_contact",
        "invoice_contact",
        "prefix",
        "tax_label",
      ])
        profile[key] = text(
          f,
          key,
          key.includes("address") ||
            key.includes("instructions") ||
            key === "bank_details"
            ? 3000
            : 250,
        );
      profile.sales_discount_bps = minorAmount(
        text(f, "sales_discount_bps") || "0",
      );
      profile.tax_bps = minorAmount(text(f, "tax_bps") || "0");
      if (
        Number(profile.sales_discount_bps) > 10000 ||
        Number(profile.tax_bps) > 10000
      )
        throw Error("Percentage cannot exceed 100%.");
      profile.require_owner_approval = f.get("require_owner_approval") === "on";
      profile.notifications_enabled = f.get("notifications_enabled") === "on";
      profile.reminders_enabled = f.get("reminders_enabled") === "on";
      profile.reminder_days = z.coerce
        .number()
        .int()
        .min(1)
        .max(90)
        .parse(f.get("reminder_days"));
      const current = await i.db
        .from("msbd_settings")
        .select("profile")
        .single();
      if (current.error) throw Error("Company settings unavailable");
      p.profile = { ...current.data.profile, ...profile };
    } else if (action === "role")
      p.role = z
        .enum(["admin", "sales", "finance", "management", "none"])
        .parse(f.get("role"));
    else if (action === "template_save")
      p = {
        ...p,
        event: z
          .enum([
            "document_issued",
            "invoice_reminder",
            "document_cancelled",
            "client_registered",
            "approval_required",
            "document_approved",
            "document_viewed",
            "quotation_accepted",
            "quotation_rejected",
            "quotation_revision_requested",
            "document_status_changed",
            "quotation_expiring",
            "unanswered_request",
          ])
          .parse(f.get("event")),
        subject: text(f, "subject", 180, 2),
        body: text(f, "body", 5000, 2),
        enabled: f.get("enabled") === "on",
      };
    if (
      [
        "approve",
        "issue",
        "payment_confirm",
        "payment_reverse",
        "cancel",
        "write_off",
        "credit_note",
        "role",
        "client_portal",
        "statement",
      ].includes(action) &&
      f.get("confirm") !== "on"
    )
      throw Error("Explicit confirmation is required.");
    const result = await businessCommand(i.user.id, action, p);
    after(async () => {
      const { deliverBusinessNotifications } = await import(
        "@/lib/business-desk/notifications"
      );
      await deliverBusinessNotifications().catch(() => {});
    });
    revalidatePath("/business-desk", "layout");
    revalidatePath("/client-portal", "layout");
    const destination =
      action === "request_convert" && result.id
        ? `/business-desk/quotations?new=1&client=${result.id}`
        : [
              "document_save",
              "document_revise",
              "quotation_convert",
              "credit_note",
              "issue",
              "statement",
            ].includes(action) && result.id
          ? `/business-desk/documents/${result.id}`
          : action.startsWith("client")
            ? "/business-desk/clients"
            : action.startsWith("payment")
              ? "/business-desk/payments"
              : action === "settings" ||
                  action === "role" ||
                  action === "template_save"
                ? "/business-desk/settings"
                : action === "service_save"
                  ? "/business-desk/services"
                  : "/business-desk/dashboard";
    redirect(
      `${destination}${destination.includes("?") ? "&" : "?"}notice=saved`,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "NEXT_REDIRECT") throw e;
    redirect("/business-desk/dashboard?notice=change-error");
  }
}
export async function clientResponse(f: FormData) {
  const { businessIdentity } = await import("@/lib/business-desk/server");
  const { intakeDatabase } = await import("@/lib/supabase/server");
  const i = await businessIdentity();
  if (!i) redirect("/account?next=%2Fclient-portal");
  const document = id.parse(f.get("document"));
  const action = z
    .enum(["accepted", "rejected", "revision_requested"])
    .parse(f.get("response"));
  if (f.get("confirm") !== "on") redirect("/client-portal?notice=confirm");
  const { error } = await intakeDatabase().rpc("msbd_client_response", {
    p_actor: i.user.id,
    p_document: document,
    p_action: action,
    p_terms: f.get("terms") === "on",
    p_reason: text(f, "reason"),
  });
  after(async () => {
    const { deliverBusinessNotifications } = await import(
      "@/lib/business-desk/notifications"
    );
    await deliverBusinessNotifications().catch(() => {});
  });
  revalidatePath("/client-portal");
  redirect(
    `/client-portal?notice=${error ? "response-error" : "response-saved"}`,
  );
}
export async function createClientInline(input: unknown) {
  const i = await requireBusiness(["super_admin", "admin", "sales"]);
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(180),
      email: z.email().max(254),
      kind: z.enum(["individual", "corporate"]),
    })
    .safeParse(input);
  if (!parsed.success) return { error: "Enter a client name and valid email." };
  try {
    const result = await businessCommand(i.user.id, "client_save", {
      ...parsed.data,
      email: parsed.data.email.toLowerCase(),
      profile: {},
    });
    revalidatePath("/business-desk/clients");
    return { id: result.id!, name: parsed.data.name };
  } catch {
    return {
      error:
        "Client could not be saved. Check for an existing client with this email.",
    };
  }
}
export async function saveClientNote(f: FormData) {
  const i = await requireBusiness(["super_admin", "admin", "sales", "finance"]);
  await businessCommand(i.user.id, "client_note", {
    client_id: id.parse(f.get("client_id")),
    body: text(f, "body", 5000, 2),
  });
  revalidatePath("/business-desk/clients");
}
export async function saveBranding(f: FormData) {
  const i = await requireBusiness(["super_admin"]);
  const { intakeDatabase } = await import("@/lib/supabase/server");
  const { randomUUID } = await import("node:crypto");
  const { attachmentType } = await import("@/lib/business-desk/attachments");
  const current = await i.db.from("msbd_settings").select("profile").single();
  if (current.error) throw Error("Company settings unavailable");
  const profile = { ...current.data.profile };
  const selected = z
    .enum(["logo", "signature", "stamp"])
    .parse(f.get("asset_kind"));
  for (const kind of [selected]) {
    const file = f.get("asset");
    if (!(file instanceof File) || !file.size) continue;
    if (file.size > 2097152) throw Error("Use a PNG or JPEG up to 2 MiB");
    const bytes = Buffer.from(await file.arrayBuffer());
    const type = attachmentType(bytes);
    if (!["image/png", "image/jpeg"].includes(type || ""))
      throw Error("Use a PNG or JPEG image");
    const { PDFDocument } = await import("pdf-lib");
    const validation = await PDFDocument.create();
    const image =
      type === "image/png"
        ? await validation.embedPng(bytes)
        : await validation.embedJpg(bytes);
    if (image.width > 4096 || image.height > 4096)
      throw Error("Use an image no larger than 4096 pixels per side.");
    const path = `${kind}/${randomUUID()}.${type === "image/png" ? "png" : "jpg"}`;
    const result = await intakeDatabase()
      .storage.from("business-branding")
      .upload(path, bytes, { contentType: type!, upsert: false });
    if (result.error) throw Error("Branding upload failed");
    profile[`${kind}_path`] = path;
  }
  await businessCommand(i.user.id, "settings", { profile });
  revalidatePath("/business-desk/settings");
  redirect("/business-desk/settings?notice=saved");
}
