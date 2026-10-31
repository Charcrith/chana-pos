import type { OrderStatus } from "@/db/schema";

export const STATUS_LABELS: Record<OrderStatus, string> = {
  new: "ใหม่",
  preparing: "กำลังทำ",
  ready: "พร้อม",
  out_for_delivery: "กำลังส่ง",
  delivered: "ส่งแล้ว",
};

export const NEXT_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
  new: "preparing",
  preparing: "ready",
  ready: "out_for_delivery",
  out_for_delivery: "delivered",
};
