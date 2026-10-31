"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  type CustomerActionState,
} from "@/lib/actions/customers";
import { Alert, Button, Field, Input, PageHeader, Textarea } from "@/components/ui";

const initial: CustomerActionState = {};

export default function NewCustomerPage() {
  const [state, action, pending] = useActionState(createCustomerAction, initial);

  return (
    <div>
      <PageHeader title="เพิ่มลูกค้า" />
      <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
        <Field label="ชื่อ" htmlFor="name">
          <Input id="name" name="name" required />
        </Field>
        <Field label="เบอร์โทร" htmlFor="phone">
          <Input id="phone" name="phone" required inputMode="tel" />
        </Field>
        <Field label="ที่อยู่" htmlFor="address">
          <Textarea id="address" name="address" rows={3} />
        </Field>
        <Field label="หมายเหตุ" htmlFor="notes">
          <Textarea id="notes" name="notes" rows={2} />
        </Field>
        {state.error ? (
          <div className="mb-3">
            <Alert>{state.error}</Alert>
          </div>
        ) : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      </form>
    </div>
  );
}
