"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import {
  categories,
  optionGroups,
  options,
  products,
} from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { parseBahtInput } from "@/lib/money";
import {
  categorySchema,
  optionGroupSchema,
  optionSchema,
  productSchema,
} from "@/lib/validations";

export type ProductActionState = {
  error?: string;
  success?: string;
};

export async function createCategoryAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const db = getDb();
  await db.insert(categories).values(parsed.data);
  revalidatePath("/products");
  return { success: "เพิ่มหมวดแล้ว" };
}

export async function updateCategoryAction(
  id: number,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = categorySchema.safeParse({
    name: formData.get("name"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const db = getDb();
  await db.update(categories).set(parsed.data).where(eq(categories.id, id));
  revalidatePath("/products");
  return { success: "บันทึกหมวดแล้ว" };
}

export async function createProductAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    basePriceBaht: formData.get("basePriceBaht"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") !== "off",
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const basePrice = parseBahtInput(parsed.data.basePriceBaht);
  if (basePrice === null) return { error: "ราคาไม่ถูกต้อง" };

  const db = getDb();
  const result = await db.insert(products).values({
    categoryId: parsed.data.categoryId,
    name: parsed.data.name,
    basePrice,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
    notes: parsed.data.notes || null,
  });
  const id = Number(result[0].insertId);
  revalidatePath("/products");
  redirect(`/products/${id}`);
}

export async function updateProductAction(
  id: number,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = productSchema.safeParse({
    categoryId: formData.get("categoryId"),
    name: formData.get("name"),
    basePriceBaht: formData.get("basePriceBaht"),
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") === "on" || formData.get("isActive") === "true",
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const basePrice = parseBahtInput(parsed.data.basePriceBaht);
  if (basePrice === null) return { error: "ราคาไม่ถูกต้อง" };

  const db = getDb();
  await db
    .update(products)
    .set({
      categoryId: parsed.data.categoryId,
      name: parsed.data.name,
      basePrice,
      sortOrder: parsed.data.sortOrder,
      isActive: parsed.data.isActive,
      notes: parsed.data.notes || null,
    })
    .where(eq(products.id, id));

  revalidatePath("/products");
  revalidatePath(`/products/${id}`);
  return { success: "บันทึกสินค้าแล้ว" };
}

export async function createOptionGroupAction(
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = optionGroupSchema.safeParse({
    productId: formData.get("productId"),
    name: formData.get("name"),
    minSelect: formData.get("minSelect") ?? 0,
    maxSelect: formData.get("maxSelect") ?? 1,
    sortOrder: formData.get("sortOrder") ?? 0,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  if (parsed.data.maxSelect < parsed.data.minSelect) {
    return { error: "max ต้องไม่น้อยกว่า min" };
  }
  const db = getDb();
  await db.insert(optionGroups).values(parsed.data);
  revalidatePath(`/products/${parsed.data.productId}`);
  return { success: "เพิ่มกลุ่มตัวเลือกแล้ว" };
}

export async function createOptionAction(
  productId: number,
  _prev: ProductActionState,
  formData: FormData,
): Promise<ProductActionState> {
  await requireUser();
  const parsed = optionSchema.safeParse({
    optionGroupId: formData.get("optionGroupId"),
    name: formData.get("name"),
    priceDeltaBaht: formData.get("priceDeltaBaht") ?? "0",
    sortOrder: formData.get("sortOrder") ?? 0,
    isActive: formData.get("isActive") !== "off",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }
  const priceDelta = parseBahtInput(parsed.data.priceDeltaBaht);
  if (priceDelta === null) return { error: "ราคาเพิ่มไม่ถูกต้อง" };

  const db = getDb();
  await db.insert(options).values({
    optionGroupId: parsed.data.optionGroupId,
    name: parsed.data.name,
    priceDelta,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  });
  revalidatePath(`/products/${productId}`);
  return { success: "เพิ่มตัวเลือกแล้ว" };
}

export async function toggleOptionActiveAction(
  productId: number,
  optionId: number,
  isActive: boolean,
) {
  await requireUser();
  const db = getDb();
  await db
    .update(options)
    .set({ isActive })
    .where(eq(options.id, optionId));
  revalidatePath(`/products/${productId}`);
}
