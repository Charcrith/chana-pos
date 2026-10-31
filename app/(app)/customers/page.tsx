import Link from "next/link";
import { EmptyState, PageHeader } from "@/components/ui";
import { searchCustomers } from "@/lib/actions/customers";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const rows = await searchCustomers(q ?? "");

  return (
    <div>
      <PageHeader
        title="ลูกค้า"
        subtitle="ค้นหาชื่อหรือเบอร์โทร"
        action={
          <Link
            href="/customers/new"
            className="rounded-xl bg-[var(--accent)] px-3 py-2 text-sm font-medium text-white"
          >
            + เพิ่ม
          </Link>
        }
      />

      <form className="mb-4">
        <input
          name="q"
          defaultValue={q}
          placeholder="ค้นหาชื่อ / เบอร์..."
          className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2.5 text-base outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-soft)]"
        />
      </form>

      {rows.length === 0 ? (
        <EmptyState>ยังไม่มีลูกค้า — กดเพิ่มเพื่อสร้างใหม่</EmptyState>
      ) : (
        <ul className="space-y-2">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/customers/${c.id}`}
                className="block rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--line)]"
              >
                <div className="font-medium">{c.name}</div>
                <div className="text-sm text-[var(--muted)]">{c.phone}</div>
                {c.address ? (
                  <div className="mt-1 line-clamp-1 text-xs text-[var(--muted)]">
                    {c.address}
                  </div>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
