"use server";

import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import { getDb } from "@/db";
import { orderItems, orders } from "@/db/schema";
import { requireUser } from "@/lib/auth";

const TZ = "Asia/Bangkok";

export type ReportRange = "day" | "week" | "month" | "year" | "custom";

function bangkokNow() {
  return toZonedTime(new Date(), TZ);
}

function rangeBounds(
  range: ReportRange,
  from?: string,
  to?: string,
): { start: Date; end: Date } {
  const now = bangkokNow();

  if (range === "custom" && from && to) {
    const start = fromZonedTime(`${from}T00:00:00`, TZ);
    const end = fromZonedTime(`${to}T24:00:00`, TZ);
    return { start, end };
  }

  let startLocal: Date;
  let endLocal: Date;

  switch (range) {
    case "week":
      startLocal = startOfWeek(now, { weekStartsOn: 1 });
      endLocal = endOfWeek(now, { weekStartsOn: 1 });
      break;
    case "month":
      startLocal = startOfMonth(now);
      endLocal = endOfMonth(now);
      break;
    case "year":
      startLocal = startOfYear(now);
      endLocal = endOfYear(now);
      break;
    case "day":
    default:
      startLocal = new Date(now);
      startLocal.setHours(0, 0, 0, 0);
      endLocal = new Date(now);
      endLocal.setHours(23, 59, 59, 999);
      break;
  }

  // Convert Bangkok-local wall times to UTC instants
  const ymd = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const start = fromZonedTime(`${ymd(startLocal)}T00:00:00`, TZ);
  const end = fromZonedTime(
    `${ymd(endLocal)}T23:59:59.999`,
    TZ,
  );
  // Use exclusive end by adding 1ms via next day start for consistency
  const endExclusive = new Date(end.getTime() + 1);
  return { start, end: endExclusive };
}

export async function getSalesReport(input: {
  range: ReportRange;
  from?: string;
  to?: string;
}) {
  await requireUser();
  const { start, end } = rangeBounds(input.range, input.from, input.to);
  const db = getDb();

  // Count Delivered only (per plan)
  const deliveredOrders = await db
    .select()
    .from(orders)
    .where(
      and(
        eq(orders.status, "delivered"),
        gte(orders.deliveredAt, start),
        lt(orders.deliveredAt, end),
      ),
    )
    .orderBy(desc(orders.deliveredAt));

  const orderCount = deliveredOrders.length;
  const totalSatang = deliveredOrders.reduce((s, o) => s + o.total, 0);

  const orderIds = deliveredOrders.map((o) => o.id);
  let topProducts: {
    productName: string;
    qty: number;
    revenue: number;
  }[] = [];

  if (orderIds.length > 0) {
    const rows = await db
      .select({
        productName: orderItems.productNameSnapshot,
        qty: sql<number>`sum(${orderItems.qty})`.mapWith(Number),
        revenue: sql<number>`sum(${orderItems.lineTotal})`.mapWith(Number),
      })
      .from(orderItems)
      .where(
        sql`${orderItems.orderId} in (${sql.join(
          orderIds.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      )
      .groupBy(orderItems.productNameSnapshot)
      .orderBy(desc(sql`sum(${orderItems.lineTotal})`))
      .limit(10);

    topProducts = rows.map((r) => ({
      productName: r.productName,
      qty: r.qty,
      revenue: r.revenue,
    }));
  }

  return {
    orderCount,
    totalSatang,
    topProducts,
    start,
    end,
  };
}
