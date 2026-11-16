"use client";
import { useState, useRef } from "react";
import { previewTotal } from "@/lib/business-desk/money";
import {
  changeBusiness,
  createClientInline,
} from "@/app/business-desk/actions";
type Item = {
  description: string;
  quantity: string;
  price: string;
  discount: string;
};
type Service = {
  id: string;
  name: string;
  description: string;
  price_minor: number | null;
  unit: string;
  currency: string;
};
export default function BusinessDocumentEditor({
  clients,
  services,
  existing,
  taxBps = 0,
  preferredClient = "",
}: {
  clients: { id: string; name: string }[];
  services: Service[];
  existing?: {
    id: string;
    kind: string;
    client_id: string;
    due_date: string | null;
    content: {
      title: string;
      currency: string;
      items: {
        description: string;
        quantity_milli: number;
        unit_minor: number;
        discount_minor: number;
      }[];
      discount_minor?: number;
      charges_minor?: number;
      delivery_minor?: number;
      tax_bps?: number;
      terms?: string;
      category?: string;
      schedule?: { label: string; amount_minor: number; due_date: string }[];
    };
  };
  taxBps?: number;
  preferredClient?: string;
}) {
  const [items, setItems] = useState<Item[]>(
    existing?.content.items.map((x) => ({
      description: x.description,
      quantity: String(x.quantity_milli / 1000),
      price: (x.unit_minor / 100).toFixed(2),
      discount: ((x.discount_minor || 0) / 100).toFixed(2),
    })) || [{ description: "", quantity: "1", price: "", discount: "0" }],
  );
  const [clientOptions, setClientOptions] = useState(clients),
    [selectedClient, setSelectedClient] = useState(
      existing?.client_id || preferredClient,
    ),
    [newName, setNewName] = useState(""),
    [newEmail, setNewEmail] = useState(""),
    [clientMessage, setClientMessage] = useState(""),
    [creating, setCreating] = useState(false);
  const [currency, setCurrency] = useState(existing?.content.currency || "NGN");
  const formRef = useRef<HTMLFormElement>(null);
  const [schedule, setSchedule] = useState<
    { label: string; amount: string; due_date: string }[]
  >(
    existing?.content.schedule?.map((s) => ({
      label: s.label,
      amount: (s.amount_minor / 100).toFixed(2),
      due_date: s.due_date,
    })) || [],
  );
  const [scheduleError, setScheduleError] = useState("");
  return (
    <form action={changeBusiness} className="bd-panel" ref={formRef}>
      <input type="hidden" name="action" value="document_save" />
      {existing && <input type="hidden" name="id" value={existing.id} />}
      <h2>{existing ? "Edit draft" : "Prepare a document"}</h2>
      <p>
        All totals are calculated and validated on the server. Approval is
        required before issue.
      </p>
      <div className="bd-grid">
        <label>
          Document type
          <select name="kind" defaultValue={existing?.kind || "quotation"}>
            {["quotation", "invoice", "order"].map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </label>
        <label>
          Client
          <select
            name="client_id"
            required
            value={selectedClient}
            onChange={(e) => setSelectedClient(e.target.value)}
          >
            <option value="" disabled>
              Select a client
            </option>
            {clientOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Project / document title
          <input
            name="title"
            required
            maxLength={180}
            defaultValue={existing?.content.title}
          />
        </label>
        <label>
          Currency
          <select
            name="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {["NGN", "USD", "GBP", "EUR"].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label>
          Valid until / invoice due date
          <input
            type="date"
            name="due_date"
            defaultValue={existing?.due_date || ""}
          />
        </label>
        <label>
          Service category
          <input
            name="category"
            maxLength={120}
            defaultValue={existing?.content.category}
          />
        </label>
      </div>
      <details>
        <summary>Register a new client here</summary>
        <div className="bd-grid">
          <label>
            Client name
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              maxLength={180}
            />
          </label>
          <label>
            Client email
            <input
              type="text"
              inputMode="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              maxLength={254}
            />
          </label>
        </div>
        <button
          type="button"
          className="bd-secondary"
          disabled={creating}
          onClick={async () => {
            setCreating(true);
            try {
              const c = await createClientInline({
                name: newName,
                email: newEmail,
                kind: "corporate",
              });
              if (c.id) {
                setClientOptions([
                  ...clientOptions,
                  { id: c.id, name: c.name! },
                ]);
                setSelectedClient(c.id);
                setClientMessage(
                  "Client saved and selected. Continue preparing this document.",
                );
              } else setClientMessage(c.error || "Client unavailable.");
            } catch {
              setClientMessage("Client could not be saved.");
            } finally {
              setCreating(false);
            }
          }}
        >
          {creating ? "Saving client…" : "Save & select client"}
        </button>
        <p role="status">{clientMessage}</p>
      </details>
      <p>
        Prices use the selected currency. Changing currency does not convert
        entered amounts.
      </p>
      <h3>Line items</h3>
      <input type="hidden" name="items" value={JSON.stringify(items)} />
      {items.map((item, n) => (
        <fieldset className="bd-item" key={n}>
          <legend>Item {n + 1}</legend>
          <label>
            Add from service catalogue
            <select
              value=""
              onChange={(e) => {
                const s = services.find((s) => s.id === e.target.value);
                if (s) {
                  setItems(
                    items.map((x, k) =>
                      k === n
                        ? {
                            ...x,
                            description: s.description
                              ? `${s.name} — ${s.description}`
                              : s.name,
                            price:
                              s.price_minor === null
                                ? ""
                                : (s.price_minor / 100).toFixed(2),
                          }
                        : x,
                    ),
                  );
                }
              }}
            >
              <option value="">Custom item</option>
              {services
                .filter((s) => s.currency === currency)
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} · {s.unit}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Description
            <textarea
              required
              maxLength={1000}
              value={item.description}
              onChange={(e) =>
                setItems(
                  items.map((x, k) =>
                    k === n ? { ...x, description: e.target.value } : x,
                  ),
                )
              }
            />
          </label>
          <div className="bd-grid">
            {(
              [
                ["quantity", "Quantity · up to 3 decimals"],
                ["price", `Unit price (${currency})`],
                ["discount", `Item discount (${currency})`],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  inputMode="decimal"
                  value={item[key]}
                  onChange={(e) =>
                    setItems(
                      items.map((x, k) =>
                        k === n ? { ...x, [key]: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
          </div>
          {items.length > 1 && (
            <button
              type="button"
              className="bd-quiet"
              onClick={() => setItems(items.filter((_, k) => k !== n))}
            >
              Remove this item
            </button>
          )}
        </fieldset>
      ))}
      <button
        type="button"
        className="bd-secondary"
        disabled={items.length >= 50}
        onClick={() =>
          setItems([
            ...items,
            { description: "", quantity: "1", price: "", discount: "0" },
          ])
        }
      >
        + Add line item
      </button>
      <div className="bd-grid">
        {(
          [
            ["discount", "Overall discount"],
            ["charges", "Additional charges"],
            ["delivery", "Delivery"],
          ] as const
        ).map(([k, l]) => (
          <label key={k}>
            {l} ({currency})
            <input
              name={k}
              inputMode="decimal"
              defaultValue={(
                (existing?.content[
                  `${k}_minor` as
                    | "discount_minor"
                    | "charges_minor"
                    | "delivery_minor"
                ] || 0) / 100
              ).toFixed(2)}
            />
          </label>
        ))}
        <label>
          Tax
          <select name="tax_bps" defaultValue={existing?.content.tax_bps || 0}>
            <option value="0">No tax applied</option>
            {taxBps > 0 && (
              <option value={taxBps}>
                Authorised configured tax · {taxBps / 100}%
              </option>
            )}
          </select>
        </label>
      </div>
      <label>
        Scope, specifications, milestones, delivery, warranty, support,
        exclusions and payment terms
        <textarea
          name="terms"
          rows={8}
          maxLength={20000}
          defaultValue={existing?.content.terms}
        />
      </label>
      <details>
        <summary>Payment schedule · deposit and balance</summary>
        <input type="hidden" name="schedule" value={JSON.stringify(schedule)} />
        <p>
          Choose a preset or add custom milestones. The amounts must equal the
          server-calculated document total.
        </p>
        <div className="bd-actions">
          {[100, 70, 60, 50].map((percent) => (
            <button
              className="bd-secondary"
              type="button"
              key={percent}
              onClick={() => {
                try {
                  if (!formRef.current) return;
                  const f = new FormData(formRef.current);
                  const total = previewTotal(
                    items,
                    String(f.get("discount") || "0"),
                    String(f.get("charges") || "0"),
                    String(f.get("delivery") || "0"),
                    Number(f.get("tax_bps") || 0),
                  );
                  const deposit = Number(
                    (BigInt(total) * BigInt(percent) + 50n) / 100n,
                  );
                  setSchedule(
                    percent === 100
                      ? [
                          {
                            label: "Full payment",
                            amount: (total / 100).toFixed(2),
                            due_date: "",
                          },
                        ]
                      : [
                          {
                            label: `${percent}% deposit`,
                            amount: (deposit / 100).toFixed(2),
                            due_date: "",
                          },
                          {
                            label: `${100 - percent}% balance`,
                            amount: ((total - deposit) / 100).toFixed(2),
                            due_date: "",
                          },
                        ],
                  );
                  setScheduleError("");
                } catch {
                  setScheduleError(
                    "Complete valid line items and totals before choosing a schedule.",
                  );
                }
              }}
            >
              {percent === 100
                ? "Full payment"
                : `${percent}% / ${100 - percent}%`}
            </button>
          ))}
        </div>
        {scheduleError && <p role="alert">{scheduleError}</p>}
        {schedule.map((entry, n) => (
          <div className="bd-grid bd-item" key={n}>
            {(
              [
                ["label", "Milestone"],
                ["amount", `Amount (${currency})`],
                ["due_date", "Due date"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  required
                  type={key === "due_date" ? "date" : "text"}
                  value={entry[key]}
                  onChange={(e) =>
                    setSchedule(
                      schedule.map((x, k) =>
                        k === n ? { ...x, [key]: e.target.value } : x,
                      ),
                    )
                  }
                />
              </label>
            ))}
            <button
              type="button"
              className="bd-quiet"
              onClick={() => setSchedule(schedule.filter((_, k) => k !== n))}
            >
              Remove milestone
            </button>
          </div>
        ))}
        <button
          type="button"
          className="bd-secondary"
          disabled={schedule.length >= 24}
          onClick={() =>
            setSchedule([...schedule, { label: "", amount: "", due_date: "" }])
          }
        >
          + Custom milestone
        </button>
      </details>
      <button className="bd-primary">Save draft</button>
    </form>
  );
}
