import { BottomNav } from "@/components/bottom-nav";
import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <div className="app-shell">
      <div className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 pb-24 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-[var(--accent)]">ชานา OMS</p>
            <p className="text-xs text-[var(--muted)]">{user.name}</p>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-lg px-2 py-1 text-xs text-[var(--muted)] ring-1 ring-[var(--line)] hover:bg-white"
            >
              ออกจากระบบ
            </button>
          </form>
        </div>
        <main className="flex-1">{children}</main>
      </div>
      <BottomNav />
    </div>
  );
}
