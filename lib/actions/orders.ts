"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import {
  advanceOrderStatus,
  createOrder,
  setOrderStatus,
} from "@/lib/orders";
import type { Fulfillment, OrderStatus } from "@/db/schema";
import { createOrderSchema } from "@/lib/validations";

export type OrderActionState = {
  error?: string;
  success?: string;
};

export async function createOrderAction(
  payload: unknown,
): Promise<OrderActionState & { orderId?: number }> {
  const user = await requireUser();
  const parsed = createOrderSchema.safeParse(payload);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    const orderId = await createOrder({
      customerId: parsed.data.customerId,
      fulfillment: parsed.data.fulfillment as Fulfillment,
      notes: parsed.data.notes,
      items: parsed.data.items,
      userId: user.id,
    });
    revalidatePath("/orders");
    redirect(`/orders/${orderId}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // Next redirect
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "บันทึกออเดอร์ไม่สำเร็จ",
    };
  }
}

export async function advanceStatusAction(orderId: number) {
  const user = await requireUser();
  try {
    await advanceOrderStatus(orderId, user.id);
  } catch (e) {
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "อัปเดตสถานะไม่สำเร็จ",
    };
  }
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true as const };
}

export async function setStatusAction(orderId: number, status: OrderStatus) {
  const user = await requireUser();
  try {
    await setOrderStatus(orderId, status, user.id);
  } catch (e) {
    console.error(e);
    return {
      error: e instanceof Error ? e.message : "อัปเดตสถานะไม่สำเร็จ",
    };
  }
  revalidatePath("/orders");
  revalidatePath(`/orders/${orderId}`);
  return { success: true as const };
}
