import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customers, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatTHB } from "@/lib/money";
import { STATUS_LABELS } from "@/lib/orders";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { CustomerEditForm } from "@/components/customer-edit-form";
import { formatInTimeZone } from "date-fns-tz";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const db = getDb();
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id))
    .limit(1);
  if (!customer) notFound();

  const history = await db
    .select()
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.createdAt))
    .limit(30);

  return (
    <div>
      <PageHeader
        title={customer.name}
        subtitle={customer.phone}
        action={
          <Link
            href={`/orders/new?customerId=${customer.id}`}
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            คีย์ออเดอร์
          </Link>
        }
      />

      <CustomerEditForm customer={customer} />

      <h2 className="mb-2 mt-6 text-sm font-semibold text-[var(--muted)]">
        ประวัติออเดอร์
      </h2>
      {history.length === 0 ? (
        <EmptyState>ยังไม่มีออเดอร์</EmptyState>
      ) : (
        <ul className="space-y-2">
          {history.map((o) => (
            <li key={o.id}>
              <Link
                href={`/orders/${o.id}`}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--line)]"
              >
                <div>
                  <div className="font-medium">{o.orderNumber}</div>
                  <div className="text-xs text-[var(--muted)]">
                    {formatInTimeZone(
                      o.createdAt,
                      "Asia/Bangkok",
                      "d MMM yy HH:mm",
                    )}{" "}
                    · {STATUS_LABELS[o.status]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{formatTHB(o.total)}</div>
                  <StatusBadge status={o.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
