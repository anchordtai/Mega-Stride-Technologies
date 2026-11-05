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
  center("Certificate of Completion", 425, 32);
  center("This certifies that", 375, 13);
  center(c.holder_name.normalize("NFC"), 332, 29);
  center(
    "completed the learning requirements and passed the assessment for",
    288,
    12,
  );
  center(c.course_title, 249, 21);
  center(`Issued ${new Date(c.issued_at).toISOString().slice(0, 10)}`, 170, 12);
  center(`Reference ${c.code}`, 145, 10);
  center(
    `https://www.megastride.com.ng/academy/certificates/${c.code}`,
    113,
    8,
  );
  center(
    "Independent professional training. This is not a manufacturer certification.",
    75,
    9,
  );
  return doc.save();
}
