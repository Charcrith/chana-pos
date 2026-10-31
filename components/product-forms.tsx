"use client";

import { useActionState } from "react";
import {
  createOptionAction,
  createOptionGroupAction,
  createProductAction,
  updateProductAction,
  type ProductActionState,
} from "@/lib/actions/products";
import {
  Alert,
  Button,
  Field,
  Input,
  Select,
  Textarea,
} from "@/components/ui";
import { satangToBaht } from "@/lib/money";

const initial: ProductActionState = {};

export function ProductCreateForm({
  categories,
}: {
  categories: { id: number; name: string }[];
}) {
  const [state, action, pending] = useActionState(createProductAction, initial);

  return (
    <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
      <Field label="หมวดหมู่" htmlFor="categoryId">
        <Select id="categoryId" name="categoryId" required defaultValue="">
          <option value="" disabled>
            เลือกหมวด
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="ชื่อสินค้า" htmlFor="name">
        <Input id="name" name="name" required />
      </Field>
      <Field label="ราคาฐาน (บาท)" htmlFor="basePriceBaht">
        <Input
          id="basePriceBaht"
          name="basePriceBaht"
          inputMode="decimal"
          placeholder="50"
          required
        />
      </Field>
      <Field label="หมายเหตุภายใน" htmlFor="notes">
        <Textarea id="notes" name="notes" rows={2} />
      </Field>
      <input type="hidden" name="isActive" value="true" />
      {state.error ? (
        <div className="mb-3">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึก"}
      </Button>
    </form>
  );
}

export function ProductEditForm({
  product,
  categories,
}: {
  product: {
    id: number;
    categoryId: number;
    name: string;
    basePrice: number;
    isActive: boolean;
    notes: string | null;
    sortOrder: number;
  };
  categories: { id: number; name: string }[];
}) {
  const bound = updateProductAction.bind(null, product.id);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
      <Field label="หมวดหมู่" htmlFor="categoryId">
        <Select
          id="categoryId"
          name="categoryId"
          required
          defaultValue={product.categoryId}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="ชื่อสินค้า" htmlFor="name">
        <Input id="name" name="name" defaultValue={product.name} required />
      </Field>
      <Field label="ราคาฐาน (บาท)" htmlFor="basePriceBaht">
        <Input
          id="basePriceBaht"
          name="basePriceBaht"
          inputMode="decimal"
          defaultValue={String(satangToBaht(product.basePrice))}
          required
        />
      </Field>
      <Field label="ลำดับ" htmlFor="sortOrder">
        <Input
          id="sortOrder"
          name="sortOrder"
          type="number"
          defaultValue={product.sortOrder}
        />
      </Field>
      <label className="mb-3 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="isActive"
          value="true"
          defaultChecked={product.isActive}
          className="size-4 rounded"
        />
        เปิดขาย
      </label>
      <Field label="หมายเหตุภายใน" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={product.notes ?? ""}
        />
      </Field>
      {state.error ? (
        <div className="mb-3">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
      {state.success ? (
        <div className="mb-3">
          <Alert tone="success">{state.success}</Alert>
        </div>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "กำลังบันทึก..." : "บันทึกสินค้า"}
      </Button>
    </form>
  );
}

export function OptionGroupCreateForm({ productId }: { productId: number }) {
  const [state, action, pending] = useActionState(
    createOptionGroupAction,
    initial,
  );

  return (
    <form action={action} className="mt-2 space-y-2 rounded-xl bg-[var(--surface-2)] p-3">
      <input type="hidden" name="productId" value={productId} />
      <Input name="name" placeholder="ชื่อกลุ่ม เช่น ท็อปปิ้ง" required />
      <div className="flex gap-2">
        <Input name="minSelect" type="number" defaultValue={0} placeholder="min" />
        <Input name="maxSelect" type="number" defaultValue={5} placeholder="max" />
      </div>
      {state.error ? <Alert>{state.error}</Alert> : null}
      <Button type="submit" variant="secondary" className="w-full" disabled={pending}>
        เพิ่มกลุ่มตัวเลือก
      </Button>
    </form>
  );
}

export function OptionCreateForm({
  productId,
  optionGroupId,
}: {
  productId: number;
  optionGroupId: number;
}) {
  const bound = createOptionAction.bind(null, productId);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="mt-2 flex flex-wrap gap-2">
      <input type="hidden" name="optionGroupId" value={optionGroupId} />
      <Input name="name" placeholder="ชื่อตัวเลือก" required className="min-w-[8rem] flex-1" />
      <Input
        name="priceDeltaBaht"
        placeholder="+บาท"
        inputMode="decimal"
        defaultValue="0"
        className="w-24"
      />
      <Button type="submit" variant="secondary" disabled={pending}>
        เพิ่ม
      </Button>
      {state.error ? (
        <div className="basis-full">
          <Alert>{state.error}</Alert>
        </div>
      ) : null}
    </form>
  );
}
