import "server-only";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import QRCode from "qrcode";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { intakeDatabase } from "@/lib/supabase/server";
import { amountInWords } from "./money";
const money = (value: number, currency: string) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    currencyDisplay: "code",
  }).format(value / 100);
import type { BusinessDocument } from "./server";
export async function businessPdf(
  d: BusinessDocument,
  previewCompany?: Record<string, unknown>,
) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await readFile(join(process.cwd(), "public/fonts/manrope-400.ttf")),
    { subset: true },
  );
  const bold = await doc.embedFont(
    await readFile(join(process.cwd(), "public/fonts/manrope-700.ttf")),
    { subset: true },
  );
  const company = d.company_snapshot || previewCompany || {};
  const client = d.client_snapshot;
  const asset = async (key: string) => {
    const path = company[key];
    if (!path) return null;
    if (
      typeof path !== "string" ||
      !/^(?:logo|signature|stamp)\/[a-f0-9-]{36}\.(png|jpg)$/.test(path)
    )
      throw Error("Invalid historical branding path");
    const file = await intakeDatabase()
      .storage.from("business-branding")
      .download(path);
    if (file.error || !file.data)
      throw Error("Historical branding unavailable");
    const bytes = Buffer.from(await file.data.arrayBuffer());
    return path.endsWith(".png") ? doc.embedPng(bytes) : doc.embedJpg(bytes);
  };
  const logo =
    (await asset("logo_path")) ||
    (await doc.embedJpg(
      await readFile(join(process.cwd(), "public/brand/mega-stride-logo.jpg")),
    ));
  const signature = await asset("signature_path"),
    stamp = await asset("stamp_path");
  const navy = rgb(0.035, 0.09, 0.19),
    blue = rgb(0.04, 0.3, 0.64),
    grey = rgb(0.38, 0.43, 0.5);
  let page = doc.addPage([595.28, 841.89]),
    y = 790;
  const addPage = () => {
    page = doc.addPage([595.28, 841.89]);
    y = 780;
    page.drawText(`${d.number} · continued`, {
      x: 40,
      y,
      size: 9,
      font,
      color: grey,
    });
    y -= 28;
  };
  const line = (text: string, size = 10, color = navy, width = 505) => {
    const face = size >= 11 ? bold : font;
    const clean = text.normalize("NFC").replace(/[\u0000-\u001f\u007f]/g, " ");
    const words = clean.split(/\s+/);
    let row = "";
    for (const word of words) {
      const candidate = row ? `${row} ${word}` : word;
      if (face.widthOfTextAtSize(candidate, size) > width && row) {
        if (y < 85) addPage();
        page.drawText(row, { x: 45, y, size, font: face, color });
        y -= size + 7;
        row = word;
      } else row = candidate;
    }
    if (y < 85) addPage();
    // Split unbroken long strings so descriptions and references stay on-page.
    while (face.widthOfTextAtSize(row, size) > width) {
      let n = row.length;
      while (n > 1 && face.widthOfTextAtSize(row.slice(0, n), size) > width)
        n--;
      page.drawText(row.slice(0, n), { x: 45, y, size, font: face, color });
      row = row.slice(n);
      y -= size + 7;
      if (y < 85) addPage();
    }
    page.drawText(row, { x: 45, y, size, font: face, color });
    y -= size + 7;
  };
  const logoSize = logo.scaleToFit(270, 75);
  page.drawImage(logo, {
    x: 40,
    y: 735,
    width: logoSize.width,
    height: logoSize.height,
  });
  y = 715;
  line(String(company.name || "Mega Stride Technologies Limited"), 14, blue);
  for (const key of ["address", "phone", "email", "website"])
    if (company[key]) line(String(company[key]), 8, grey);
  if (company.registration) line(`RC ${company.registration}`, 8, grey);
  y -= 13;
  line(d.kind.replaceAll("_", " ").toUpperCase(), 23, blue);
  line(d.number, 12);
  if (!d.issued_at)
    line(
      "DRAFT · NOT ISSUED · NO PAYMENT ACKNOWLEDGED",
      11,
      rgb(0.7, 0.22, 0.05),
    );
  line(
    `Issue date: ${d.issued_at ? new Date(d.issued_at).toLocaleDateString("en-GB", { timeZone: "Africa/Lagos" }) : "Not issued"}${d.due_date ? `   |   ${d.kind === "quotation" ? "Valid until" : "Due date"}: ${d.due_date}` : ""}`,
    9,
    grey,
  );
  y -= 9;
  line(`Prepared for: ${client?.name || "Client preview"}`, 11);
  if (client?.profile?.address) line(client.profile.address, 9);
  if (client?.email) line(client.email, 9);
  if (client?.profile?.phone) line(client.profile.phone, 9);
  y -= 10;
  line(d.content.title, 13, blue);
  y -= 7;
  const tableHeader = () => {
    if (y < 140) addPage();
    page.drawRectangle({
      x: 40,
      y: y - 12,
      width: 515,
      height: 27,
      color: rgb(0.92, 0.95, 0.99),
    });
    page.drawText("ITEM / DESCRIPTION", {
      x: 45,
      y: y - 3,
      size: 8,
      font: bold,
      color: blue,
    });
    page.drawText("LINE TOTAL", {
      x: 472,
      y: y - 3,
      size: 8,
      font: bold,
      color: blue,
    });
    y -= 35;
  };
  tableHeader();
  for (const [n, item] of d.content.items.entries()) {
    const needed =
      Math.ceil(font.widthOfTextAtSize(item.description, 10) / 350) * 18 + 60;
    if (y < Math.max(150, needed)) {
      addPage();
      tableHeader();
    }
    const amount = money(item.total_minor, d.content.currency);
    page.drawText(amount, {
      x: 550 - font.widthOfTextAtSize(amount, 9),
      y,
      size: 9,
      font,
      color: navy,
    });
    line(`${n + 1}. ${item.description}`, 10, navy, 350);
    line(
      `${item.quantity_milli / 1000} × ${money(item.unit_minor, d.content.currency)}${item.discount_minor ? `  |  Item discount ${money(item.discount_minor, d.content.currency)}` : ""}`,
      8,
      grey,
      350,
    );
    y -= 6;
    page.drawLine({
      start: { x: 45, y },
      end: { x: 550, y },
      thickness: 0.4,
      color: rgb(0.85, 0.89, 0.94),
    });
    y -= 19;
  }
  if (y < 220) addPage();
  y -= 6;
  for (const [label, value] of [
    ["Subtotal", d.content.subtotal_minor],
    ["Item discounts", d.content.line_discount_minor],
    ["Overall discount", d.content.discount_minor],
    [`Tax (${(d.content.tax_bps || 0) / 100}%)`, d.content.tax_minor],
    ["Additional charges", d.content.charges_minor],
    ["Delivery", d.content.delivery_minor],
  ] as const)
    if (value) line(`${label}: ${money(value, d.content.currency)}`, 10);
  line(`TOTAL ${money(d.content.total_minor, d.content.currency)}`, 17, blue);
  line(amountInWords(d.content.total_minor, d.content.currency), 9, grey);
  if (d.content.payment_reference)
    line(`Payment reference: ${d.content.payment_reference}`, 9);
  if (d.content.invoice_number) line(`Invoice: ${d.content.invoice_number}`, 9);
  if (d.content.payment_method)
    line(`Payment method: ${d.content.payment_method.replaceAll("_", " ")}`, 9);
  if (d.content.outstanding_minor !== undefined)
    line(
      `Balance at issue: ${money(d.content.outstanding_minor, d.content.currency)}`,
      10,
    );
  if (d.content.schedule?.length) {
    y -= 8;
    line("Payment schedule", 11, blue);
    for (const milestone of d.content.schedule)
      line(
        `${milestone.label}: ${money(milestone.amount_minor, d.content.currency)} · ${milestone.due_date}`,
        9,
      );
  }
  if (d.content.terms) {
    if (y < 150) addPage();
    y -= 10;
    line("Scope, terms & conditions", 11, blue);
    for (const paragraph of d.content.terms.split("\n")) line(paragraph, 9);
  }
  if (["quotation", "invoice", "order"].includes(d.kind))
    for (const key of ["payment_instructions", "bank_details"])
      if (company[key]) {
        y -= 8;
        line(String(company[key]), 9);
      }
  if (
    y <
    (d.issued_at
      ? signature || stamp
        ? 300
        : 220
      : signature || stamp
        ? 160
        : 90)
  )
    addPage();
  if (signature || stamp) {
    if (y < 190) addPage();
    if (signature) {
      const box = signature.scaleToFit(160, 60);
      page.drawImage(signature, {
        x: 45,
        y: y - 65,
        width: box.width,
        height: box.height,
      });
    }
    if (stamp) {
      const box = stamp.scaleToFit(80, 60);
      page.drawImage(stamp, {
        x: 260,
        y: y - 65,
        width: box.width,
        height: box.height,
      });
    }
    y -= 80;
  }
  y -= 12;
  line(String(company.signatory || "Authorised company representative"), 10);
  if (company.designation) line(String(company.designation), 9, grey);
  line(
    String(
      company.signature_note ||
        "Unsigned unless an authorised signature is supplied.",
    ),
    8,
    grey,
  );
  if (d.issued_at) {
    if (y < 180) addPage();
    y -= 10;
    const qr = await doc.embedPng(
      await QRCode.toBuffer(
        `https://www.megastride.com.ng/document/verify/${d.token}`,
        { type: "png", width: 200, margin: 2, errorCorrectionLevel: "M" },
      ),
    );
    page.drawImage(qr, { x: 45, y: y - 90, width: 90, height: 90 });
    page.drawText("Scan to verify authenticity and current status", {
      x: 150,
      y: y - 25,
      size: 8,
      font,
      color: grey,
    });
    y -= 110;
  }
  const pages = doc.getPages();
  pages.forEach((p, n) => {
    p.drawLine({
      start: { x: 40, y: 51 },
      end: { x: 555, y: 51 },
      thickness: 0.7,
      color: rgb(0.8, 0.85, 0.9),
    });
    p.drawText(
      `${String(company.email || "info@megastride.com.ng")} · ${String(company.phone || "+2347075721887")}`,
      { x: 40, y: 36, size: 7, font, color: grey },
    );
    p.drawText(`${n + 1} / ${pages.length}`, {
      x: 525,
      y: 36,
      size: 8,
      font,
      color: grey,
    });
  });
  doc.setTitle(`${d.kind} ${d.number}`);
  doc.setAuthor(String(company.name || "Mega Stride Technologies Limited"));
  return Buffer.from(await doc.save());
}
export async function documentBytes(
  d: BusinessDocument,
  previewCompany?: Record<string, unknown>,
) {
  const db = intakeDatabase();
  if (d.pdf_path) {
    const { data, error } = await db.storage
      .from("business-documents")
      .download(d.pdf_path);
    if (error || !data) throw Error("Document snapshot unavailable");
    const bytes = Buffer.from(await data.arrayBuffer());
    if (createHash("sha256").update(bytes).digest("hex") !== d.pdf_sha256)
      throw Error("Document integrity check failed");
    return bytes;
  }
  let bytes = await businessPdf(d, previewCompany);
  if (!d.issued_at || !d.content_hash) return bytes;
  const path = `${d.id}/${d.content_hash}.pdf`;
  const { error } = await db.storage
    .from("business-documents")
    .upload(path, bytes, { contentType: "application/pdf", upsert: false });
  if (error) {
    const existing = await db.storage.from("business-documents").download(path);
    if (existing.error || !existing.data)
      throw Error("Document snapshot could not be saved");
    bytes = Buffer.from(await existing.data.arrayBuffer());
  }
  const saved = await db.rpc("msbd_record_pdf", {
    p_id: d.id,
    p_hash: d.content_hash,
    p_path: path,
    p_sha: createHash("sha256").update(bytes).digest("hex"),
  });
  if (saved.error) throw Error("Document snapshot could not be recorded");
  return bytes;
}
