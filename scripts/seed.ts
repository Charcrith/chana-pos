import "dotenv/config";
import { eq } from "drizzle-orm";
import { getDb, getPool } from "../db";
import {
  categories,
  customers,
  optionGroups,
  options,
  products,
  users,
} from "../db/schema";
import { hashPassword } from "../lib/auth";
import { bahtToSatang } from "../lib/money";

async function main() {
  const db = getDb();

  const [existing] = await db
    .select()
    .from(users)
    .where(eq(users.username, "staff"))
    .limit(1);

  if (!existing) {
    await db.insert(users).values({
      name: "พนักงาน",
      username: "staff",
      passwordHash: await hashPassword("staff1234"),
    });
    console.log("Created user: staff / staff1234");
  } else {
    console.log("User staff already exists");
  }

  const [existingCat] = await db.select().from(categories).limit(1);
  if (existingCat) {
    console.log("Categories already present — skip menu seed");
    await getPool().end();
    process.exit(0);
  }

  const catResult = await db.insert(categories).values([
    { name: "ข้าวกล่อง", sortOrder: 1, isActive: true },
    { name: "เครื่องดื่ม", sortOrder: 2, isActive: true },
    { name: "ค่าส่ง", sortOrder: 9, isActive: true },
  ]);
  // insertId is first of multi-insert for mysql2
  const firstCatId = Number(catResult[0].insertId);
  const riceCat = firstCatId;
  const drinkCat = firstCatId + 1;
  const deliveryCat = firstCatId + 2;

  const padKraPao = await db.insert(products).values({
    categoryId: riceCat,
    name: "กระเพราหมู",
    basePrice: bahtToSatang(50),
    isActive: true,
    sortOrder: 1,
  });
  const productId = Number(padKraPao[0].insertId);

  await db.insert(products).values([
    {
      categoryId: riceCat,
      name: "กะเพราไก่",
      basePrice: bahtToSatang(50),
      isActive: true,
      sortOrder: 2,
    },
    {
      categoryId: drinkCat,
      name: "น้ำเปล่า",
      basePrice: bahtToSatang(10),
      isActive: true,
      sortOrder: 1,
    },
    {
      categoryId: deliveryCat,
      name: "ค่าส่งใกล้",
      basePrice: bahtToSatang(20),
      isActive: true,
      sortOrder: 1,
      notes: "ติ๊กเป็นรายการ — ไม่มีช่องค่าส่งแยก",
    },
    {
      categoryId: deliveryCat,
      name: "ค่าส่งไกล",
      basePrice: bahtToSatang(40),
      isActive: true,
      sortOrder: 2,
    },
  ]);

  const groupResult = await db.insert(optionGroups).values({
    productId,
    name: "ท็อปปิ้ง",
    minSelect: 0,
    maxSelect: 5,
    sortOrder: 1,
  });
  const groupId = Number(groupResult[0].insertId);

  await db.insert(options).values([
    {
      optionGroupId: groupId,
      name: "ไข่ดาว",
      priceDelta: bahtToSatang(10),
      sortOrder: 1,
      isActive: true,
    },
    {
      optionGroupId: groupId,
      name: "ข้าวเพิ่ม",
      priceDelta: bahtToSatang(10),
      sortOrder: 2,
      isActive: true,
    },
    {
      optionGroupId: groupId,
      name: "ไม่เผ็ด",
      priceDelta: 0,
      sortOrder: 3,
      isActive: true,
    },
  ]);

  const spiceGroup = await db.insert(optionGroups).values({
    productId,
    name: "ระดับความเผ็ด",
    minSelect: 1,
    maxSelect: 1,
    sortOrder: 2,
  });
  const spiceId = Number(spiceGroup[0].insertId);
  await db.insert(options).values([
    {
      optionGroupId: spiceId,
      name: "เผ็ดปกติ",
      priceDelta: 0,
      sortOrder: 1,
      isActive: true,
    },
    {
      optionGroupId: spiceId,
      name: "เผ็ดมาก",
      priceDelta: 0,
      sortOrder: 2,
      isActive: true,
    },
  ]);

  await db.insert(customers).values({
    name: "คุณตัวอย่าง",
    phone: "0812345678",
    address: "123 ถนนตัวอย่าง",
    notes: "ชอบเผ็ดน้อย",
  });

  console.log("Seeded sample menu + customer");
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
