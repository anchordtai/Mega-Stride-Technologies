import { money } from "@/lib/business-desk/money";
function Bars({
  rows,
}: {
  rows: { label: string; value: number; display?: string }[];
}) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <>
      {!rows.length && <p>No matching records yet.</p>}
      {rows.map((row, n) => (
        <div key={row.label + n}>
          <div className="flex flex-wrap justify-between gap-3">
            <span>{row.label}</span>
            <strong>{row.display || row.value}</strong>
          </div>
          <div className="bd-bar">
            <span
              style={{ width: `${Math.max(0, (row.value / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </>
  );
}
export default function BusinessCharts({
  report,
}: {
  report: Record<string, unknown>;
}) {
  const quotations = (report.quotation_monthly || []) as {
    month: string;
    count: number;
  }[];
  const conversion = report.conversion as
    | { issued: number; converted: number }
    | undefined;
  const invoices = report.invoice_performance as
    | Record<string, number>
    | undefined;
  const categories = (report.categories || []) as {
    category: string;
    currency: string;
    amount_minor: number;
  }[];
  const outstanding = (report.outstanding_clients || []) as {
    client: string;
    currency: string;
    amount_minor: number;
  }[];
  const currencies = [
    ...new Set([...categories, ...outstanding].map((r) => r.currency)),
  ];
  return (
    <>
      <div className="bd-grid">
        <section className="bd-panel">
          <h2>Monthly quotations</h2>
          <Bars
            rows={quotations.map((r) => ({ label: r.month, value: r.count }))}
          />
        </section>
        <section className="bd-panel">
          <h2>Quotation conversion</h2>
          <div className="bd-kpi">
            {conversion?.issued
              ? Math.round((conversion.converted / conversion.issued) * 100)
              : 0}
            %
          </div>
          <p>
            Issued quotation references converted to invoices. Controlled
            revisions share their original reference.
          </p>
          <Bars
            rows={[
              { label: "Issued references", value: conversion?.issued || 0 },
              {
                label: "Converted to invoice",
                value: conversion?.converted || 0,
              },
            ]}
          />
        </section>
        <section className="bd-panel">
          <h2>Invoice payment performance</h2>
          <Bars
            rows={Object.entries(invoices || {}).map(([label, value]) => ({
              label: label.replaceAll("_", " "),
              value,
            }))}
          />
        </section>
      </div>
      {currencies.map((currency) => (
        <div className="bd-grid" key={currency}>
          <section className="bd-panel">
            <h2>Confirmed receipts by service · {currency}</h2>
            <Bars
              rows={categories
                .filter((r) => r.currency === currency)
                .map((r) => ({
                  label: r.category,
                  value: r.amount_minor,
                  display: money(r.amount_minor, currency),
                }))}
            />
          </section>
          <section className="bd-panel">
            <h2>Outstanding by client · {currency}</h2>
            <Bars
              rows={outstanding
                .filter((r) => r.currency === currency)
                .map((r) => ({
                  label: r.client,
                  value: r.amount_minor,
                  display: money(r.amount_minor, currency),
                }))}
            />
          </section>
        </div>
      ))}
    </>
  );
}
