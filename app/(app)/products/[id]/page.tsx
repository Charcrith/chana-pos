import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { categories, optionGroups, options, products } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { formatTHB } from "@/lib/money";
import { PageHeader } from "@/components/ui";
import {
  OptionCreateForm,
  OptionGroupCreateForm,
  ProductEditForm,
} from "@/components/product-forms";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id: idStr } = await params;
  const id = Number(idStr);
  if (!Number.isFinite(id)) notFound();

  const db = getDb();
  const [product] = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (!product) notFound();

  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  const groups = await db
    .select()
    .from(optionGroups)
    .where(eq(optionGroups.productId, id))
    .orderBy(asc(optionGroups.sortOrder), asc(optionGroups.id));

  const optsByGroup = new Map<
    number,
    {
      id: number;
      name: string;
      priceDelta: number;
      isActive: boolean;
    }[]
  >();
  for (const g of groups) {
    const opts = await db
      .select()
      .from(options)
      .where(eq(options.optionGroupId, g.id))
      .orderBy(asc(options.sortOrder), asc(options.id));
    optsByGroup.set(g.id, opts);
  }

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`ราคาฐาน ${formatTHB(product.basePrice)}`}
      />

      <ProductEditForm
        product={product}
        categories={cats.map((c) => ({ id: c.id, name: c.name }))}
      />

      <section className="mt-6">
        <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
          กลุ่มตัวเลือก / ท็อปปิ้ง
        </h2>
        <OptionGroupCreateForm productId={id} />

        <ul className="mt-4 space-y-4">
          {groups.map((g) => (
            <li
              key={g.id}
              className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]"
            >
              <div className="font-medium">{g.name}</div>
              <div className="text-xs text-[var(--muted)]">
                เลือก {g.minSelect}–{g.maxSelect} รายการ
              </div>
              <ul className="mt-2 space-y-1">
                {(optsByGroup.get(g.id) ?? []).map((o) => (
                  <li
                    key={o.id}
                    className={`flex justify-between text-sm ${
                      o.isActive ? "" : "text-gray-400 line-through"
                    }`}
                  >
                    <span>{o.name}</span>
                    <span className="tabular-nums">
                      {o.priceDelta === 0
                        ? "—"
                        : `+${formatTHB(o.priceDelta)}`}
                    </span>
                  </li>
                ))}
              </ul>
              <OptionCreateForm productId={id} optionGroupId={g.id} />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
