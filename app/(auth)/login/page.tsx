"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

const initial: ActionState = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <div className="app-shell flex min-h-dvh items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-3xl font-bold tracking-tight text-[var(--accent)]">
            ชานา OMS
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            เข้าสู่ระบบสำหรับพนักงานร้าน
          </p>
        </div>

        <form
          action={formAction}
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-[var(--line)]"
        >
          <Field label="ชื่อผู้ใช้" htmlFor="username">
            <Input
              id="username"
              name="username"
              autoComplete="username"
              required
              autoFocus
            />
          </Field>
          <Field label="รหัสผ่าน" htmlFor="password">
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </Field>

          {state.error ? (
            <div className="mb-3">
              <Alert>{state.error}</Alert>
            </div>
          ) : null}

          <Button type="submit" className="mt-1 w-full" disabled={pending}>
            {pending ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
          </Button>
        </form>
      </div>
    </div>
  );
}
