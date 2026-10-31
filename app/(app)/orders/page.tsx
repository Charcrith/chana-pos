import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { getDb } from "@/db";
import { customers, orders, type OrderStatus } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatTHB } from "@/lib/money";
import { bangkokDayBounds } from "@/lib/orders";
import { AdvanceStatusButton } from "@/components/status-button";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { and, gte, lt } from "drizzle-orm";

const FILTERS: { key: OrderStatus | "all"; label: string }[] = [
  { key: "all", label: "ทั้งหมด" },
  { key: "new", label: "ใหม่" },
  { key: "preparing", label: "กำลังทำ" },
  { key: "ready", label: "พร้อม" },
  { key: "out_for_delivery", label: "ส่ง" },
  { key: "delivered", label: "เสร็จ" },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireUser();
  const { status: statusParam } = await searchParams;
  const status =
    FILTERS.some((f) => f.key === statusParam)
      ? (statusParam as OrderStatus | "all")
      : "all";

  const db = getDb();
  const { start, end } = bangkokDayBounds();

  const conditions = [
    gte(orders.createdAt, start),
    lt(orders.createdAt, end),
  ];
  if (status !== "all") {
    conditions.push(eq(orders.status, status));
  }

  const rows = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      total: orders.total,
      fulfillment: orders.fulfillment,
      createdAt: orders.createdAt,
      customerName: customers.name,
      customerPhone: customers.phone,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));

  return (
    <div>
      <PageHeader
        title="ออเดอร์วันนี้"
        subtitle={formatInTimeZone(new Date(), "Asia/Bangkok", "d MMMM yyyy")}
        action={
          <Link
            href="/orders/new"
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            + คีย์
          </Link>
        }
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <Link
            key={f.key}
            href={f.key === "all" ? "/orders" : `/orders?status=${f.key}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--line)] ${
              status === f.key
                ? "bg-[var(--accent)] text-white"
                : "bg-white text-[var(--ink)]"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState>ยังไม่มีออเดอร์วันนี้</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((o) => (
            <li
              key={o.id}
              className="rounded-2xl bg-white p-3 ring-1 ring-[var(--line)]"
            >
              <Link href={`/orders/${o.id}`} className="block">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold">{o.orderNumber}</div>
                    <div className="text-sm">
                      {o.customerName ?? "Walk-in"}{" "}
                      {o.customerPhone ? (
                        <span className="text-[var(--muted)]">
                          · {o.customerPhone}
                        </span>
                      ) : null}
                    </div>
                    <div className="mt-1 text-xs text-[var(--muted)]">
                      {formatInTimeZone(
                        o.createdAt,
                        "Asia/Bangkok",
                        "HH:mm",
                      )}{" "}
                      · {o.fulfillment === "delivery" ? "ส่ง" : "รับเอง"}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold tabular-nums">
                      {formatTHB(o.total)}
                    </div>
                    <div className="mt-1">
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </div>
              </Link>
              <div className="mt-2 flex justify-end">
                <AdvanceStatusButton
                  orderId={o.id}
                  status={o.status}
                  className="text-xs"
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
