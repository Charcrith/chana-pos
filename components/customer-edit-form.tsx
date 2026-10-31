"use client";

import { useActionState } from "react";
import {
  updateCustomerAction,
  type CustomerActionState,
} from "@/lib/actions/customers";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

const initial: CustomerActionState = {};

export function CustomerEditForm({
  customer,
}: {
  customer: {
    id: number;
    name: string;
    phone: string;
    address: string | null;
    notes: string | null;
  };
}) {
  const bound = updateCustomerAction.bind(null, customer.id);
  const [state, action, pending] = useActionState(bound, initial);

  return (
    <form action={action} className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
      <Field label="ชื่อ" htmlFor="name">
        <Input id="name" name="name" defaultValue={customer.name} required />
      </Field>
      <Field label="เบอร์โทร" htmlFor="phone">
        <Input
          id="phone"
          name="phone"
          defaultValue={customer.phone}
          required
          inputMode="tel"
        />
      </Field>
      <Field label="ที่อยู่" htmlFor="address">
        <Textarea
          id="address"
          name="address"
          rows={3}
          defaultValue={customer.address ?? ""}
        />
      </Field>
      <Field label="หมายเหตุ" htmlFor="notes">
        <Textarea
          id="notes"
          name="notes"
          rows={2}
          defaultValue={customer.notes ?? ""}
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
        {pending ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
      </Button>
    </form>
  );
}
