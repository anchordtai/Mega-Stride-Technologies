import { createHmac, timingSafeEqual } from "node:crypto";
export function attachmentPermit(id: string, secret: string, now = Date.now()) {
  const body = `${id}.${Math.floor(now / 1000) + 600}`;
  return `${body}.${createHmac("sha256", secret).update(`msbd-upload:${body}`).digest("hex")}`;
}
export function verifyAttachmentPermit(
  token: string,
  secret: string,
  now = Date.now(),
) {
  const match = token.match(/^([a-f0-9-]{36})\.(\d{10})\.([a-f0-9]{64})$/);
  if (!match || !secret) return null;
  const expires = Number(match[2]);
  if (expires < now / 1000 || expires > now / 1000 + 601) return null;
  const expected = createHmac("sha256", secret)
    .update(`msbd-upload:${match[1]}.${match[2]}`)
    .digest();
  return timingSafeEqual(Buffer.from(match[3], "hex"), expected)
    ? match[1]
    : null;
}
export function attachmentType(
  bytes: Uint8Array,
): "application/pdf" | "image/png" | "image/jpeg" | null {
  if (bytes.length < 5 || bytes.length > 2097152) return null;
  if (Buffer.from(bytes.subarray(0, 5)).toString() === "%PDF-")
    return "application/pdf";
  if (
    bytes.length >= 24 &&
    Buffer.from(bytes.subarray(0, 8)).equals(
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    )
  )
    return "image/png";
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return "image/jpeg";
  return null;
}
export async function boundedUpload(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) throw Error();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > max) {
      await reader.cancel();
      throw Error();
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
