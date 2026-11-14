export const currencies = ["NGN", "USD", "GBP", "EUR"] as const;
export function minorAmount(input: string, allowZero = true): number {
  if (!/^(0|[1-9]\d{0,10})(\.\d{1,2})?$/.test(input))
    throw Error("Enter an amount with at most two decimal places.");
  const [whole, fraction = ""] = input.split(".");
  const value = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
  if (value > 1000000000000n || (!allowZero && value === 0n))
    throw Error("Amount is outside the supported range.");
  return Number(value);
}
export function quantityMilli(input: string): number {
  if (!/^(0|[1-9]\d{0,5})(\.\d{1,3})?$/.test(input))
    throw Error("Quantity supports up to three decimal places.");
  const [whole, fraction = ""] = input.split(".");
  const value = Number(BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, "0")));
  if (value < 1 || value > 100000000)
    throw Error("Quantity is outside the supported range.");
  return value;
}
export function money(value: number, currency = "NGN") {
  return new Intl.NumberFormat("en-NG", { style: "currency", currency }).format(
    value / 100,
  );
}
const small = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "ten",
  "eleven",
  "twelve",
  "thirteen",
  "fourteen",
  "fifteen",
  "sixteen",
  "seventeen",
  "eighteen",
  "nineteen",
];
const tens = [
  "",
  "",
  "twenty",
  "thirty",
  "forty",
  "fifty",
  "sixty",
  "seventy",
  "eighty",
  "ninety",
];
function words(n: number): string {
  if (n < 20) return small[n];
  if (n < 100)
    return tens[Math.floor(n / 10)] + (n % 10 ? `-${small[n % 10]}` : "");
  if (n < 1000)
    return `${small[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${words(n % 100)}` : ""}`;
  for (const [scale, label] of [
    [1e12, "trillion"],
    [1e9, "billion"],
    [1e6, "million"],
    [1000, "thousand"],
  ] as const)
    if (n >= scale)
      return `${words(Math.floor(n / scale))} ${label}${n % scale ? ` ${words(n % scale)}` : ""}`;
  return "";
}
export function amountInWords(amount: number, currency: string) {
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 1000000000000)
    throw Error("Invalid amount");
  const unit =
    currency === "NGN"
      ? ["naira", "kobo"]
      : currency === "GBP"
        ? ["pounds", "pence"]
        : currency === "EUR"
          ? ["euros", "cents"]
          : ["dollars", "cents"];
  const text = `${words(Math.floor(amount / 100))} ${unit[0]}${amount % 100 ? ` and ${words(amount % 100)} ${unit[1]}` : ""} only`;
  return text[0].toUpperCase() + text.slice(1);
}
// Browser preview only; the database independently recalculates official totals.
export function previewTotal(
  items: { quantity: string; price: string; discount: string }[],
  discount: string,
  charges: string,
  delivery: string,
  taxBps: number,
) {
  let subtotal = 0n;
  for (const item of items) {
    const gross =
      (BigInt(quantityMilli(item.quantity)) * BigInt(minorAmount(item.price)) +
        500n) /
      1000n;
    const cut = BigInt(minorAmount(item.discount));
    if (cut > gross) throw Error("Item discount exceeds price");
    subtotal += gross - cut;
  }
  const cut = BigInt(minorAmount(discount || "0"));
  if (cut > subtotal) throw Error("Discount exceeds subtotal");
  subtotal -= cut;
  const total =
    subtotal +
    (subtotal * BigInt(taxBps) + 5000n) / 10000n +
    BigInt(minorAmount(charges || "0")) +
    BigInt(minorAmount(delivery || "0"));
  if (total > 1000000000000n) throw Error("Total is too large");
  return Number(total);
}
