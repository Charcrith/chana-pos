import { formatInTimeZone } from "date-fns-tz";
import { getSalesReport, type ReportRange } from "@/lib/actions/reports";
import { formatTHB } from "@/lib/money";
import { EmptyState, PageHeader } from "@/components/ui";
import Link from "next/link";

const RANGES: { key: ReportRange; label: string }[] = [
  { key: "day", label: "วันนี้" },
  { key: "week", label: "สัปดาห์นี้" },
  { key: "month", label: "เดือนนี้" },
  { key: "year", label: "ปีนี้" },
];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const sp = await searchParams;
  const range = (
    RANGES.some((r) => r.key === sp.range) ? sp.range : "day"
  ) as ReportRange;

  const report = await getSalesReport({
    range,
    from: sp.from,
    to: sp.to,
  });

  return (
    <div>
      <PageHeader
        title="รายงานยอดขาย"
        subtitle="นับเฉพาะออเดอร์สถานะ ส่งแล้ว"
      />

      <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
        {RANGES.map((r) => (
          <Link
            key={r.key}
            href={`/reports?range=${r.key}`}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium ring-1 ring-[var(--line)] ${
              range === r.key
                ? "bg-[var(--accent)] text-white"
                : "bg-white"
            }`}
          >
            {r.label}
          </Link>
        ))}
      </div>

      <p className="mb-3 text-xs text-[var(--muted)]">
        {formatInTimeZone(report.start, "Asia/Bangkok", "d MMM yyyy HH:mm")} –{" "}
        {formatInTimeZone(report.end, "Asia/Bangkok", "d MMM yyyy HH:mm")}
      </p>

      <div className="mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
          <div className="text-xs text-[var(--muted)]">จำนวนออเดอร์</div>
          <div className="text-2xl font-bold tabular-nums">
            {report.orderCount}
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-[var(--line)]">
          <div className="text-xs text-[var(--muted)]">ยอดรวม</div>
          <div className="text-2xl font-bold tabular-nums text-[var(--accent)]">
            {formatTHB(report.totalSatang)}
          </div>
        </div>
      </div>

      <h2 className="mb-2 text-sm font-semibold text-[var(--muted)]">
        สินค้าขายดี
      </h2>
      {report.topProducts.length === 0 ? (
        <EmptyState>ยังไม่มีข้อมูลในช่วงนี้</EmptyState>
      ) : (
        <ul className="space-y-2">
          {report.topProducts.map((p) => (
            <li
              key={p.productName}
              className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 ring-1 ring-[var(--line)]"
            >
              <div>
                <div className="font-medium">{p.productName}</div>
                <div className="text-xs text-[var(--muted)]">
                  {p.qty} ชิ้น
                </div>
              </div>
              <div className="tabular-nums font-medium">
                {formatTHB(p.revenue)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
