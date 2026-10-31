import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { getDb } from "@/db";
import {
  customers,
  orderItemOptions,
  orderItems,
  orders,
  orderStatusHistory,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatTHB } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders";
import { AdvanceStatusButton } from "@/components/status-button";
import { PageHeader, StatusBadge } from "@/components/ui";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const db = getDb();
  const [order] = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      status: orders.status,
      fulfillment: orders.fulfillment,
      notes: orders.notes,
      total: orders.total,
      createdAt: orders.createdAt,
      deliveredAt: orders.deliveredAt,
      customerId: orders.customerId,
      customerName: customers.name,
      customerPhone: customers.phone,
      customerAddress: customers.address,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id))
    .where(eq(orders.id, id))
    .limit(1);

  if (!order) notFound();

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .orderBy(asc(orderItems.id));

  const itemsWithOpts = await Promise.all(
    items.map(async (item) => {
      const opts = await db
        .select()
        .from(orderItemOptions)
        .where(eq(orderItemOptions.orderItemId, item.id));
      return { ...item, options: opts };
    }),
  );

  const history = await db
    .select({
      id: orderStatusHistory.id,
      fromStatus: orderStatusHistory.fromStatus,
      toStatus: orderStatusHistory.toStatus,
      changedAt: orderStatusHistory.changedAt,
      userName: users.name,
    })
    .from(orderStatusHistory)
    .innerJoin(users, eq(orderStatusHistory.changedByUserId, users.id))
    .where(eq(orderStatusHistory.orderId, id))
    .orderBy(asc(orderStatusHistory.changedAt));

  return (
    <div>
      <PageHeader
        title={order.orderNumber}
        subtitle={formatInTimeZone(
          order.createdAt,
          "Asia/Bangkok",
          "d MMM yyyy HH:mm",
        )}
        action={<StatusBadge status={order.status} />}
      />

      <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm text-[var(--muted)]">ลูกค้า</div>
            {order.customerId ? (
              <Link
                href={`/customers/${order.customerId}`}
                className="font-medium text-[var(--accent)]"
              >
                {order.customerName}
              </Link>
            ) : (
              <div className="font-medium">Walk-in</div>
            )}
            {order.customerPhone ? (
              <div className="text-sm">{order.customerPhone}</div>
            ) : null}
            {order.customerAddress ? (
              <div className="mt-1 text-sm text-[var(--muted)]">
                {order.customerAddress}
              </div>
            ) : null}
          </div>
          <div className="text-right text-sm">
            {order.fulfillment === "delivery" ? "ส่ง" : "รับเอง"}
          </div>
        </div>
        {order.notes ? (
          <div className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-sm">
            <span className="text-[var(--muted)]">หมายเหตุ: </span>
            {order.notes}
          </div>
        ) : null}
      </section>

      <section className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          รายการอาหาร
        </h2>
        <ul className="space-y-3">
          {itemsWithOpts.map((item) => (
            <li key={item.id} className="border-b border-[var(--line)] pb-2 last:border-0">
              <div className="flex justify-between">
                <div className="font-medium">
                  {item.productNameSnapshot} × {item.qty}
                </div>
                <div className="tabular-nums font-medium">
                  {formatTHB(item.lineTotal)}
                </div>
              </div>
              {item.options.length > 0 ? (
                <ul className="mt-1 text-xs text-[var(--muted)]">
                  {item.options.map((o) => (
                    <li key={o.id}>
                      + {o.optionNameSnapshot}
                      {o.priceDeltaSnapshot
                        ? ` (${formatTHB(o.priceDeltaSnapshot)})`
                        : ""}
                    </li>
                  ))}
                </ul>
              ) : null}
              {item.lineNotes ? (
                <div className="mt-1 text-xs text-[var(--muted)]">
                  โน้ต: {item.lineNotes}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <div className="mt-3 flex justify-between border-t border-[var(--line)] pt-3 text-lg font-bold">
          <span>รวม</span>
          <span className="tabular-nums text-[var(--accent)]">
            {formatTHB(order.total)}
          </span>
        </div>
      </section>

      <div className="mb-4">
        <AdvanceStatusButton
          orderId={order.id}
          status={order.status}
          className="w-full"
        />
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          ประวัติสถานะ
        </h2>
        <ul className="space-y-2">
          {history.map((h) => (
            <li
              key={h.id}
              className="rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-[var(--line)]"
            >
              <div className="font-medium">
                {h.fromStatus
                  ? `${STATUS_LABELS[h.fromStatus]} → ${STATUS_LABELS[h.toStatus]}`
                  : STATUS_LABELS[h.toStatus]}
              </div>
              <div className="text-xs text-[var(--muted)]">
                {formatInTimeZone(h.changedAt, "Asia/Bangkok", "HH:mm")} ·{" "}
                {h.userName}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
