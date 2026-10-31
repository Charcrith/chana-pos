import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string) {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string) {
  return compare(password, passwordHash);
}

export async function requireUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) {
    redirect("/login");
  }
  return {
    id: session.userId,
    username: session.username!,
    name: session.name!,
  };
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session.isLoggedIn || !session.userId) return null;
  return {
    id: session.userId,
    username: session.username!,
    name: session.name!,
  };
}

export async function loginWithPassword(username: string, password: string) {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim()))
    .limit(1);

  if (!user) {
    return { ok: false as const, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return { ok: false as const, error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  session.name = user.name;
  session.isLoggedIn = true;
  await session.save();

  return { ok: true as const };
}

export async function logout() {
  const session = await getSession();
  session.destroy();
}
