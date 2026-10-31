"use server";

import { eq, like, or, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { customers } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { customerSchema } from "@/lib/validations";

export type CustomerActionState = {
  error?: string;
  success?: string;
};

export async function searchCustomers(query: string) {
  await requireUser();
  const db = getDb();
  const q = query.trim();
  if (!q) {
    return db.select().from(customers).orderBy(desc(customers.updatedAt)).limit(50);
  }
  return db
    .select()
    .from(customers)
    .where(
      or(
        like(customers.name, `%${q}%`),
        like(customers.phone, `%${q}%`),
      ),
    )
    .orderBy(desc(customers.updatedAt))
    .limit(50);
}

export async function createCustomerAction(
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await requireUser();
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const db = getDb();
  const result = await db.insert(customers).values({
    name: parsed.data.name,
    phone: parsed.data.phone,
    address: parsed.data.address || null,
    notes: parsed.data.notes || null,
  });

  const id = Number(result[0].insertId);
  revalidatePath("/customers");
  redirect(`/customers/${id}`);
}

export async function updateCustomerAction(
  id: number,
  _prev: CustomerActionState,
  formData: FormData,
): Promise<CustomerActionState> {
  await requireUser();
  const parsed = customerSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    address: formData.get("address") || null,
    notes: formData.get("notes") || null,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  const db = getDb();
  await db
    .update(customers)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    })
    .where(eq(customers.id, id));

  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  return { success: "บันทึกแล้ว" };
}
