export async function boundedBody(request: Request, max = 20000) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("Missing body");
  let length = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > max) {
      await reader.cancel();
      throw Error("Body too large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}
