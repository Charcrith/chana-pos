import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { formatInTimeZone } from "date-fns-tz";
import { getDb } from "@/db";
import {
  options,
  orderItemOptions,
  orderItems,
  orders,
  orderStatusHistory,
  products,
  type Fulfillment,
  type OrderStatus,
} from "@/db/schema";
import { calcLineTotal, calcOrderTotal } from "@/lib/money";
import { NEXT_STATUS } from "@/lib/order-constants";

export { STATUS_LABELS, NEXT_STATUS } from "@/lib/order-constants";

export type DraftOrderItem = {
  productId: number;
  qty: number;
  optionIds: number[];
  lineNotes?: string | null;
};

export async function generateOrderNumber(now = new Date()) {
  // Asia/Bangkok day key YYMMDD
  const dayKey = formatInTimeZone(now, "Asia/Bangkok", "yyMMdd");
  const prefix = `${dayKey}-`;

  const db = getDb();
  const [row] = await db
    .select({ orderNumber: orders.orderNumber })
    .from(orders)
    .where(sql`${orders.orderNumber} like ${prefix + "%"}`)
    .orderBy(desc(orders.orderNumber))
    .limit(1);

  let seq = 1;
  if (row?.orderNumber) {
    const part = row.orderNumber.split("-")[1];
    const n = Number(part);
    if (Number.isFinite(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(3, "0")}`;
}

export async function createOrder(input: {
  customerId: number | null;
  fulfillment: Fulfillment;
  notes?: string | null;
  items: DraftOrderItem[];
  userId: number;
}) {
  const db = getDb();

  if (input.items.length === 0) {
    throw new Error("ต้องมีอย่างน้อย 1 รายการ");
  }

  const builtItems: {
    productId: number;
    productNameSnapshot: string;
    unitBasePrice: number;
    qty: number;
    lineNotes: string | null;
    lineTotal: number;
    selectedOptions: {
      optionId: number;
      optionNameSnapshot: string;
      priceDeltaSnapshot: number;
    }[];
  }[] = [];

  for (const item of input.items) {
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, item.productId))
      .limit(1);

    if (!product || !product.isActive) {
      throw new Error(`สินค้า #${item.productId} ไม่พร้อมขาย`);
    }

    const selectedOptions: {
      optionId: number;
      optionNameSnapshot: string;
      priceDeltaSnapshot: number;
    }[] = [];

    for (const optionId of item.optionIds) {
      const [opt] = await db
        .select()
        .from(options)
        .where(eq(options.id, optionId))
        .limit(1);
      if (!opt || !opt.isActive) {
        throw new Error(`ตัวเลือก #${optionId} ไม่พร้อมใช้งาน`);
      }
      selectedOptions.push({
        optionId: opt.id,
        optionNameSnapshot: opt.name,
        priceDeltaSnapshot: opt.priceDelta,
      });
    }

    const deltas = selectedOptions.map((o) => o.priceDeltaSnapshot);
    const lineTotal = calcLineTotal(product.basePrice, deltas, item.qty);

    builtItems.push({
      productId: product.id,
      productNameSnapshot: product.name,
      unitBasePrice: product.basePrice,
      qty: item.qty,
      lineNotes: item.lineNotes?.trim() || null,
      lineTotal,
      selectedOptions,
    });
  }

  const total = calcOrderTotal(builtItems.map((i) => i.lineTotal));
  const orderNumber = await generateOrderNumber();

  const result = await db.transaction(async (tx) => {
    const insertResult = await tx.insert(orders).values({
      orderNumber,
      customerId: input.customerId,
      status: "new",
      fulfillment: input.fulfillment,
      notes: input.notes?.trim() || null,
      subtotal: total,
      total,
      createdByUserId: input.userId,
    });

    const orderId = Number(insertResult[0].insertId);

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: null,
      toStatus: "new",
      changedByUserId: input.userId,
    });

    for (const item of builtItems) {
      const itemResult = await tx.insert(orderItems).values({
        orderId,
        productId: item.productId,
        productNameSnapshot: item.productNameSnapshot,
        unitBasePrice: item.unitBasePrice,
        qty: item.qty,
        lineNotes: item.lineNotes,
        lineTotal: item.lineTotal,
      });
      const orderItemId = Number(itemResult[0].insertId);

      if (item.selectedOptions.length > 0) {
        await tx.insert(orderItemOptions).values(
          item.selectedOptions.map((o) => ({
            orderItemId,
            optionId: o.optionId,
            optionNameSnapshot: o.optionNameSnapshot,
            priceDeltaSnapshot: o.priceDeltaSnapshot,
          })),
        );
      }
    }

    return orderId;
  });

  return result;
}

export async function advanceOrderStatus(orderId: number, userId: number) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new Error("ไม่พบออเดอร์");

  const next = NEXT_STATUS[order.status];
  if (!next) throw new Error("ออเดอร์นี้จบสถานะแล้ว");

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: next,
        deliveredAt: next === "delivered" ? new Date() : order.deliveredAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus: next,
      changedByUserId: userId,
    });
  });

  return next;
}

export async function setOrderStatus(
  orderId: number,
  toStatus: OrderStatus,
  userId: number,
) {
  const db = getDb();
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);

  if (!order) throw new Error("ไม่พบออเดอร์");
  if (order.status === toStatus) return toStatus;

  await db.transaction(async (tx) => {
    await tx
      .update(orders)
      .set({
        status: toStatus,
        deliveredAt:
          toStatus === "delivered" ? new Date() : order.deliveredAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStatusHistory).values({
      orderId,
      fromStatus: order.status,
      toStatus,
      changedByUserId: userId,
    });
  });

  return toStatus;
}

/** Bangkok calendar day bounds as Date (UTC instants). */
export function bangkokDayBounds(date = new Date()) {
  const day = formatInTimeZone(date, "Asia/Bangkok", "yyyy-MM-dd");
  // Construct start/end as Asia/Bangkok midnight via offset-aware ISO
  const start = new Date(`${day}T00:00:00+07:00`);
  const end = new Date(`${day}T24:00:00+07:00`);
  return { start, end, day };
}

export async function listOrdersToday(status?: OrderStatus | "all") {
  const db = getDb();
  const { start, end } = bangkokDayBounds();

  const conditions = [
    gte(orders.createdAt, start),
    lt(orders.createdAt, end),
  ];
  if (status && status !== "all") {
    conditions.push(eq(orders.status, status));
  }

  return db
    .select()
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt));
}
