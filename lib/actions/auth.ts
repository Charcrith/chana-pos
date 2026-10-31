"use server";

import { redirect } from "next/navigation";
import { loginWithPassword, logout } from "@/lib/auth";
import { loginSchema } from "@/lib/validations";

export type ActionState = {
  error?: string;
  success?: string;
};

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "ข้อมูลไม่ถูกต้อง" };
  }

  try {
    const result = await loginWithPassword(
      parsed.data.username,
      parsed.data.password,
    );
    if (!result.ok) return { error: result.error };
  } catch (e) {
    console.error(e);
    return { error: "เชื่อมต่อฐานข้อมูลไม่ได้" };
  }

  redirect("/orders");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
