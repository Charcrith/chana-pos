import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  categories,
  customers,
  optionGroups,
  options,
  products,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import {
  OrderEntryForm,
  type CatalogProduct,
} from "@/components/order-entry-form";
import { PageHeader } from "@/components/ui";

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<{ customerId?: string }>;
}) {
  await requireUser();
  const { customerId: customerIdParam } = await searchParams;
  const initialCustomerId = customerIdParam
    ? Number(customerIdParam)
    : null;

  const db = getDb();

  const customerRows = await db
    .select({
      id: customers.id,
      name: customers.name,
      phone: customers.phone,
    })
    .from(customers)
    .orderBy(desc(customers.updatedAt))
    .limit(200);

  const productRows = await db
    .select({
      id: products.id,
      name: products.name,
      basePrice: products.basePrice,
      categoryId: products.categoryId,
      categoryName: categories.name,
      sortOrder: products.sortOrder,
    })
    .from(products)
    .innerJoin(categories, eq(products.categoryId, categories.id))
    .where(eq(products.isActive, true))
    .orderBy(asc(products.sortOrder), asc(products.id));

  const catalog: CatalogProduct[] = [];
  for (const p of productRows) {
    const groups = await db
      .select()
      .from(optionGroups)
      .where(eq(optionGroups.productId, p.id))
      .orderBy(asc(optionGroups.sortOrder), asc(optionGroups.id));

    const groupsWithOpts = [];
    for (const g of groups) {
      const opts = await db
        .select()
        .from(options)
        .where(eq(options.optionGroupId, g.id))
        .orderBy(asc(options.sortOrder), asc(options.id));
      groupsWithOpts.push({
        id: g.id,
        name: g.name,
        minSelect: g.minSelect,
        maxSelect: g.maxSelect,
        options: opts
          .filter((o) => o.isActive)
          .map((o) => ({
            id: o.id,
            name: o.name,
            priceDelta: o.priceDelta,
          })),
      });
    }

    catalog.push({
      id: p.id,
      name: p.name,
      basePrice: p.basePrice,
      categoryId: p.categoryId,
      categoryName: p.categoryName,
      groups: groupsWithOpts,
    });
  }

  return (
    <div>
      <PageHeader title="คีย์ออเดอร์" subtitle="เลือกลูกค้า · เมนู · ท็อปปิ้ง" />
      <OrderEntryForm
        products={catalog}
        customers={customerRows}
        initialCustomerId={
          initialCustomerId && Number.isFinite(initialCustomerId)
            ? initialCustomerId
            : null
        }
      />
    </div>
  );
}
