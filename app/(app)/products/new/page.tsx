import { asc } from "drizzle-orm";
import { getDb } from "@/db";
import { categories } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { ProductCreateForm } from "@/components/product-forms";
import { PageHeader } from "@/components/ui";

export default async function NewProductPage() {
  await requireUser();
  const db = getDb();
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.sortOrder), asc(categories.id));

  return (
    <div>
      <PageHeader title="เพิ่มสินค้า" />
      <ProductCreateForm categories={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}
