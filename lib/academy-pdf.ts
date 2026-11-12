import QRCode from "qrcode";
import { PDFDocument, rgb } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
export async function certificatePdf(c: {
  holder_name: string;
  course_title: string;
  code: string;
  issued_at: string;
}) {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const font = await doc.embedFont(
    await readFile(join(process.cwd(), "public/fonts/manrope.ttf")),
    { subset: true },
  );
  const p = doc.addPage([842, 595]);
  const navy = rgb(0.03, 0.1, 0.2),
    blue = rgb(0.09, 0.32, 0.7);
  p.drawRectangle({
    x: 24,
    y: 24,
    width: 794,
    height: 547,
    borderWidth: 1.5,
    borderColor: blue,
  });
  p.drawRectangle({
    x: 35,
    y: 35,
    width: 772,
    height: 525,
    borderWidth: 0.5,
    borderColor: rgb(0.76, 0.66, 0.43),
  });
  const center = (text: string, y: number, size: number) => {
    const actual = Math.min(size, 720 / font.widthOfTextAtSize(text, 1));
    p.drawText(text, {
      x: (842 - font.widthOfTextAtSize(text, actual)) / 2,
      y,
      size: actual,
      font,
      color: navy,
    });
  };
  center("MEGA STRIDE TECHNOLOGIES LIMITED", 510, 18);
  center("ACADEMY", 480, 11);
  p.drawRectangle({ x: 680, y: 475, width: 35, height: 35, color: blue });
  const white = rgb(1, 1, 1);
  p.drawLine({
    start: { x: 689, y: 484 },
    end: { x: 706, y: 501 },
    thickness: 2,
    color: white,
  });
  p.drawLine({
    start: { x: 695, y: 501 },
    end: { x: 706, y: 501 },
    thickness: 2,
    color: white,
  });
  p.drawLine({
    start: { x: 706, y: 490 },
    end: { x: 706, y: 501 },
    thickness: 2,
    color: white,
  });

  center("Certificate of Completion", 425, 32);
  center("This certifies that", 375, 13);
  center(c.holder_name.normalize("NFC"), 332, 29);
  center(
    "completed the learning requirements and passed the assessment for",
    288,
    12,
  );
  center(c.course_title, 249, 21);
  p.drawText(`Completed ${new Date(c.issued_at).toISOString().slice(0, 10)}`, {
    x: 70,
    y: 190,
    size: 11,
    font,
    color: navy,
  });
  p.drawText("Anchord Taiwo", { x: 70, y: 145, size: 15, font, color: navy });
  p.drawText("Chief Executive Officer", {
    x: 70,
    y: 125,
    size: 10,
    font,
    color: navy,
  });
  p.drawText("Signature not supplied · unsigned record", {
    x: 70,
    y: 105,
    size: 8,
    font,
    color: navy,
  });
  const url = `https://www.megastride.com.ng/academy/certificates/${c.code}`;
  const qr = await doc.embedPng(
    await QRCode.toBuffer(url, {
      type: "png",
      errorCorrectionLevel: "M",
      margin: 4,
      width: 320,
    }),
  );
  p.drawImage(qr, { x: 650, y: 96, width: 110, height: 110 });
  p.drawText("Scan to verify this record", {
    x: 648,
    y: 85,
    size: 8,
    font,
    color: navy,
  });
  center(`Certificate ID ${c.code}`, 60, 8);
  center(
    "Independent professional training. This is not a manufacturer certification.",
    43,
    7,
  );
  return doc.save();
}
