import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatTHB } from "@/lib/money";
import { EmptyState, PageHeader } from "@/components/ui";
import { CategoryCreateForm } from "@/components/category-create-form";

export default async function ProductsPage() {
  await requireUser();
  const db = getDb();

  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  const prods = await db
    .select({
      id: products.id,
      name: products.name,
      basePrice: products.basePrice,
      isActive: products.isActive,
      categoryId: products.categoryId,
      categoryName: categories.name,
    })
    .from(products)
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .orderBy(asc(products.sortOrder), asc(products.id));

  return (
    <div>
      <PageHeader
        title="เมนู"
        subtitle="หมวดหมู่ · สินค้า · ตัวเลือก"
        action={
          <Link
            href="/products/new"
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            + สินค้า
          </Link>
        }
      />

      <section className="mb-6">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          หมวดหมู่
        </h2>
        <CategoryCreateForm />
        {cats.length === 0 ? (
          <EmptyState>ยังไม่มีหมวด — เพิ่มก่อนสร้างสินค้า</EmptyState>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {cats.map((c) => (
              <li
                key={c.id}
                className={`rounded-lg px-2.5 py-1 text-sm ring-1 ring-[var(--line)] ${
                  c.isActive ? "bg-white" : "bg-gray-100 text-gray-500 line-through"
                }`}
              >
                {c.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          สินค้าทั้งหมด
        </h2>
        {prods.length === 0 ? (
          <EmptyState>ยังไม่มีสินค้า</EmptyState>
        ) : (
          <ul className="space-y-2">
            {prods.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/products/${p.id}`}
                  className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--line)]"
                >
                  <div>
                    <div className="font-medium">
                      {p.name}
                      {!p.isActive ? (
                        <span className="ml-2 text-xs text-red-600">ปิดขาย</span>
                      ) : null}
                    </div>
                    <div className="text-xs text-[var(--muted)]">
                      {p.categoryName ?? "—"}
                    </div>
                  </div>
                  <div className="font-medium tabular-nums">
                    {formatTHB(p.basePrice)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
