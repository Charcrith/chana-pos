import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "../db";
import { customers, options, products, users } from "../db/schema";
import {
  advanceOrderStatus,
  createOrder,
  listOrdersToday,
} from "../lib/orders";
import { formatTHB } from "../lib/money";

async function main() {
  const db = getDb();
  const [user] = await db.select().from(users).limit(1);
  const [cust] = await db.select().from(customers).limit(1);
  const [prod] = await db
    .select()
    .from(products)
    .where(eq(products.name, "กระเพราหมู"))
    .limit(1);
  const opts = await db.select().from(options);
  const egg = opts.find((o) => o.name === "ไข่ดาว")!;
  const rice = opts.find((o) => o.name === "ข้าวเพิ่ม")!;
  const spice = opts.find((o) => o.name === "เผ็ดปกติ")!;

  const orderId = await createOrder({
    customerId: cust.id,
    fulfillment: "delivery",
    notes: "ทดสอบจาก smoke",
    userId: user.id,
    items: [
      {
        productId: prod.id,
        qty: 2,
        optionIds: [egg.id, rice.id, spice.id],
        lineNotes: "ไม่ใส่ผัก",
      },
    ],
  });

  const orders = await listOrdersToday();
  const o = orders.find((x) => x.id === orderId)!;
  console.log("order", o.orderNumber, formatTHB(o.total));
  if (o.total !== 14000) {
    throw new Error(`expected 14000 satang, got ${o.total}`);
  }
  await advanceOrderStatus(orderId, user.id);
  await advanceOrderStatus(orderId, user.id);
  console.log("SMOKE OK");
  await getPool().end();
  process.exit(0);
}

main().catch(async (e) => {
  console.error(e);
  try {
    await getPool().end();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
