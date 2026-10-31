"use client";

import { useActionState } from "react";
import {
  createCategoryAction,
  type ProductActionState,
} from "@/lib/actions/products";
import { Alert, Button, Input } from "@/components/ui";

const initial: ProductActionState = {};

export function CategoryCreateForm() {
  const [state, action, pending] = useActionState(createCategoryAction, initial);

  return (
    <form action={action} className="flex gap-2">
      <Input name="name" placeholder="ชื่อหมวดใหม่" required className="flex-1" />
      <input type="hidden" name="isActive" value="true" />
      <Button type="submit" disabled={pending}>
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
