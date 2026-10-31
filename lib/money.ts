/** Money helpers — store as satang (integer), display as THB. */

export function bahtToSatang(baht: number): number {
  return Math.round(baht * 100);
}

export function satangToBaht(satang: number): number {
  return satang / 100;
}

export function formatTHB(satang: number): string {
  const baht = satangToBaht(satang);
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: baht % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(baht);
}

/**
 * unit = base_price + sum(selected option price_deltas)
 * line = unit × qty
 */
export function calcUnitPrice(
  basePriceSatang: number,
  optionDeltasSatang: number[],
): number {
  return (
    basePriceSatang + optionDeltasSatang.reduce((sum, d) => sum + d, 0)
  );
}

export function calcLineTotal(
  basePriceSatang: number,
  optionDeltasSatang: number[],
  qty: number,
): number {
  return calcUnitPrice(basePriceSatang, optionDeltasSatang) * qty;
}

export function calcOrderTotal(lineTotalsSatang: number[]): number {
  return lineTotalsSatang.reduce((sum, t) => sum + t, 0);
}

/** Parse Thai baht input string/number into satang. Accepts "50", "50.5", "50.50". */
export function parseBahtInput(raw: string): number | null {
  const cleaned = raw.replace(/,/g, "").trim();
  if (!cleaned) return null;
  const n = Number(cleaned);
  if (!Number.isFinite(n) || n < 0) return null;
  return bahtToSatang(n);
}
