import { z } from "zod";

export const loginSchema = z.object({
  username: z.string().trim().min(1, "กรุณากรอกชื่อผู้ใช้"),
  password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});

export const customerSchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อ"),
  phone: z.string().trim().min(1, "กรุณากรอกเบอร์โทร"),
  address: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "กรุณากรอกชื่อหมวด"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const productSchema = z.object({
  categoryId: z.coerce.number().int().positive("เลือกหมวดหมู่"),
  name: z.string().trim().min(1, "กรุณากรอกชื่อสินค้า"),
  /** Baht string from form; converted to satang in action */
  basePriceBaht: z.string().trim().min(1, "กรุณากรอกราคา"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
  notes: z.string().trim().optional().nullable(),
});

export const optionGroupSchema = z.object({
  productId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อกลุ่มตัวเลือก"),
  minSelect: z.coerce.number().int().min(0).default(0),
  maxSelect: z.coerce.number().int().min(1).default(1),
  sortOrder: z.coerce.number().int().default(0),
});

export const optionSchema = z.object({
  optionGroupId: z.coerce.number().int().positive(),
  name: z.string().trim().min(1, "กรุณากรอกชื่อตัวเลือก"),
  priceDeltaBaht: z.string().trim().default("0"),
  sortOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
});

export const orderItemInputSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().min(1),
  optionIds: z.array(z.number().int().positive()).default([]),
  lineNotes: z.string().optional().nullable(),
});

export const createOrderSchema = z.object({
  customerId: z.number().int().positive().nullable(),
  fulfillment: z.enum(["delivery", "pickup"]),
  notes: z.string().optional().nullable(),
  items: z.array(orderItemInputSchema).min(1, "ต้องมีอย่างน้อย 1 รายการ"),
});
