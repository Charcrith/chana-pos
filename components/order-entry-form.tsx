"use client";

import { useMemo, useState, useTransition } from "react";
import { createOrderAction } from "@/lib/actions/orders";
import { calcLineTotal, calcOrderTotal, formatTHB } from "@/lib/money";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

export type CatalogProduct = {
  id: number;
  name: string;
  basePrice: number;
  categoryId: number;
  categoryName: string;
  groups: {
    id: number;
    name: string;
    minSelect: number;
    maxSelect: number;
    options: {
      id: number;
      name: string;
      priceDelta: number;
    }[];
  }[];
};

export type CatalogCustomer = {
  id: number;
  name: string;
  phone: string;
};

type LineDraft = {
  key: string;
  productId: number;
  productName: string;
  basePrice: number;
  qty: number;
  optionIds: number[];
  optionLabels: string[];
  optionDeltas: number[];
  lineNotes: string;
};

export function OrderEntryForm({
  products,
  customers,
  initialCustomerId,
}: {
  products: CatalogProduct[];
  customers: CatalogCustomer[];
  initialCustomerId?: number | null;
}) {
  const [customerId, setCustomerId] = useState<number | "">(
    initialCustomerId ?? "",
  );
  const [customerQuery, setCustomerQuery] = useState("");
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">(
    "delivery",
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  // Product picker state
  const [selectedProductId, setSelectedProductId] = useState<number | "">("");
  const [qty, setQty] = useState(1);
  const [pickedOptions, setPickedOptions] = useState<number[]>([]);
  const [lineNotes, setLineNotes] = useState("");

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const filteredCustomers = useMemo(() => {
    const q = customerQuery.trim();
    if (!q) return customers.slice(0, 20);
    return customers
      .filter(
        (c) => c.name.includes(q) || c.phone.includes(q),
      )
      .slice(0, 20);
  }, [customers, customerQuery]);

  const previewUnit = selectedProduct
    ? calcLineTotal(
        selectedProduct.basePrice,
        selectedProduct.groups
          .flatMap((g) => g.options)
          .filter((o) => pickedOptions.includes(o.id))
          .map((o) => o.priceDelta),
        1,
      )
    : 0;

  const previewLine = selectedProduct
    ? calcLineTotal(
        selectedProduct.basePrice,
        selectedProduct.groups
          .flatMap((g) => g.options)
          .filter((o) => pickedOptions.includes(o.id))
          .map((o) => o.priceDelta),
        qty,
      )
    : 0;

  const orderTotal = calcOrderTotal(
    lines.map((l) => calcLineTotal(l.basePrice, l.optionDeltas, l.qty)),
  );

  function toggleOption(optionId: number, group: CatalogProduct["groups"][0]) {
    setPickedOptions((prev) => {
      const inGroup = group.options.map((o) => o.id);
      const selectedInGroup = prev.filter((id) => inGroup.includes(id));
      if (prev.includes(optionId)) {
        return prev.filter((id) => id !== optionId);
      }
      if (group.maxSelect === 1) {
        return [...prev.filter((id) => !inGroup.includes(id)), optionId];
      }
      if (selectedInGroup.length >= group.maxSelect) {
        return prev;
      }
      return [...prev, optionId];
    });
  }

  function addLine() {
    if (!selectedProduct) {
      setError("เลือกสินค้าก่อน");
      return;
    }
    for (const g of selectedProduct.groups) {
      const count = pickedOptions.filter((id) =>
        g.options.some((o) => o.id === id),
      ).length;
      if (count < g.minSelect) {
        setError(`กลุ่ม "${g.name}" ต้องเลือกอย่างน้อย ${g.minSelect}`);
        return;
      }
    }

    const opts = selectedProduct.groups
      .flatMap((g) => g.options)
      .filter((o) => pickedOptions.includes(o.id));

    setLines((prev) => [
      ...prev,
      {
        key: `${Date.now()}-${selectedProduct.id}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        basePrice: selectedProduct.basePrice,
        qty,
        optionIds: opts.map((o) => o.id),
        optionLabels: opts.map((o) => o.name),
        optionDeltas: opts.map((o) => o.priceDelta),
        lineNotes,
      },
    ]);
    setSelectedProductId("");
    setQty(1);
    setPickedOptions([]);
    setLineNotes("");
    setError(null);
  }

  function submit() {
    setError(null);
    if (lines.length === 0) {
      setError("ต้องมีอย่างน้อย 1 รายการ");
      return;
    }
    start(async () => {
      const result = await createOrderAction({
        customerId: customerId === "" ? null : Number(customerId),
        fulfillment,
        notes,
        items: lines.map((l) => ({
          productId: l.productId,
          qty: l.qty,
          optionIds: l.optionIds,
          lineNotes: l.lineNotes || null,
        })),
      });
      if (result?.error) setError(result.error);
    });
  }

  const categories = useMemo(() => {
    const map = new Map<number, string>();
    for (const p of products) map.set(p.categoryId, p.categoryName);
    return [...map.entries()];
  }, [products]);

  const [categoryFilter, setCategoryFilter] = useState<number | "all">("all");
  const visibleProducts =
    categoryFilter === "all"
      ? products
      : products.filter((p) => p.categoryId === categoryFilter);

  return (
    <div className="space-y-4 pb-28">
      <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          ลูกค้า
        </h2>
        <Input
          placeholder="ค้นหาชื่อ / เบอร์..."
          value={customerQuery}
          onChange={(e) => setCustomerQuery(e.target.value)}
          className="mb-2"
        />
        <Select
          value={customerId}
          onChange={(e) =>
            setCustomerId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">— ไม่ระบุ / walk-in —</option>
          {filteredCustomers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} · {c.phone}
            </option>
          ))}
        </Select>
        <div className="mt-3">
          <Field label="ประเภท">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={fulfillment === "delivery" ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setFulfillment("delivery")}
              >
                ส่ง
              </Button>
              <Button
                type="button"
                variant={fulfillment === "pickup" ? "primary" : "secondary"}
                className="flex-1"
                onClick={() => setFulfillment("pickup")}
              >
                รับเอง
              </Button>
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          เพิ่มรายการ
        </h2>
        <div className="mb-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={`rounded-lg px-2.5 py-1 text-xs ring-1 ring-[var(--line)] ${
              categoryFilter === "all"
                ? "bg-[var(--accent)] text-white"
                : "bg-white"
            }`}
          >
            ทั้งหมด
          </button>
          {categories.map(([id, name]) => (
            <button
              key={id}
              type="button"
              onClick={() => setCategoryFilter(id)}
              className={`rounded-lg px-2.5 py-1 text-xs ring-1 ring-[var(--line)] ${
                categoryFilter === id
                  ? "bg-[var(--accent)] text-white"
                  : "bg-white"
              }`}
            >
              {name}
            </button>
          ))}
        </div>

        <Field label="สินค้า">
          <Select
            value={selectedProductId}
            onChange={(e) => {
              setSelectedProductId(
                e.target.value ? Number(e.target.value) : "",
              );
              setPickedOptions([]);
            }}
          >
            <option value="">เลือกเมนู...</option>
            {visibleProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatTHB(p.basePrice)}
              </option>
            ))}
          </Select>
        </Field>

        {selectedProduct ? (
          <div className="space-y-3">
            {selectedProduct.groups.map((g) => (
              <div key={g.id}>
                <div className="mb-1 text-sm font-medium">
                  {g.name}{" "}
                  <span className="text-xs font-normal text-[var(--muted)]">
                    ({g.minSelect}–{g.maxSelect})
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  {g.options.map((o) => {
                    const checked = pickedOptions.includes(o.id);
                    return (
                      <label
                        key={o.id}
                        className={`flex items-center justify-between rounded-xl px-3 py-2 text-sm ring-1 ${
                          checked
                            ? "bg-[var(--accent-soft)] ring-[var(--accent)]"
                            : "bg-[var(--surface-2)] ring-transparent"
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type={g.maxSelect === 1 ? "radio" : "checkbox"}
                            name={`group-${g.id}`}
                            checked={checked}
                            onChange={() => toggleOption(o.id, g)}
                          />
                          {o.name}
                        </span>
                        <span className="tabular-nums text-[var(--muted)]">
                          {o.priceDelta === 0
                            ? ""
                            : `+${formatTHB(o.priceDelta)}`}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}

            <div className="flex items-center gap-2">
              <Field label="จำนวน">
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
                  className="w-24"
                />
              </Field>
              <div className="flex-1 pt-5 text-right text-sm">
                ต่อหน่วย {formatTHB(previewUnit)} · บรรทัด{" "}
                <strong>{formatTHB(previewLine)}</strong>
              </div>
            </div>

            <Field label="หมายเหตุรายการ">
              <Input
                value={lineNotes}
                onChange={(e) => setLineNotes(e.target.value)}
                placeholder="เช่น ไม่ใส่ผัก"
              />
            </Field>

            <Button type="button" className="w-full" onClick={addLine}>
              เพิ่มในออเดอร์
            </Button>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          รายการในออเดอร์
        </h2>
        {lines.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">ยังไม่มีรายการ</p>
        ) : (
          <ul className="space-y-2">
            {lines.map((l) => (
              <li
                key={l.key}
                className="flex items-start justify-between gap-2 border-b border-[var(--line)] pb-2 last:border-0"
              >
                <div>
                  <div className="font-medium">
                    {l.productName} × {l.qty}
                  </div>
                  {l.optionLabels.length > 0 ? (
                    <div className="text-xs text-[var(--muted)]">
                      {l.optionLabels.join(", ")}
                    </div>
                  ) : null}
                  {l.lineNotes ? (
                    <div className="text-xs text-[var(--muted)]">
                      โน้ต: {l.lineNotes}
                    </div>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="tabular-nums font-medium">
                    {formatTHB(
                      calcLineTotal(l.basePrice, l.optionDeltas, l.qty),
                    )}
                  </div>
                  <button
                    type="button"
                    className="text-xs text-red-600"
                    onClick={() =>
                      setLines((prev) => prev.filter((x) => x.key !== l.key))
                    }
                  >
                    ลบ
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <Field label="หมายเหตุออเดอร์ (จาก LINE)">
          <Textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </Field>
      </section>

      {error ? <Alert>{error}</Alert> : null}

      <div className="fixed inset-x-0 bottom-14 z-30 border-t border-[var(--line)] bg-white/95 px-4 py-3 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1">
            <div className="text-xs text-[var(--muted)]">ยอดรวม</div>
            <div className="text-xl font-bold tabular-nums text-[var(--accent)]">
              {formatTHB(orderTotal)}
            </div>
          </div>
          <Button
            type="button"
            className="min-w-[8rem]"
            disabled={pending || lines.length === 0}
            onClick={submit}
          >
            {pending ? "กำลังบันทึก..." : "ยืนยันออเดอร์"}
          </Button>
        </div>
      </div>
    </div>
  );
}
