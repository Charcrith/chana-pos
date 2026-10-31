import { calcLineTotal, calcOrderTotal, calcUnitPrice, bahtToSatang } from "./money";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(msg);
}

// กระเพราหมู 50 + ไข่ดาว 10 + ข้าวเพิ่ม 10 × 2 = 140
const base = bahtToSatang(50);
const egg = bahtToSatang(10);
const rice = bahtToSatang(10);

assert(calcUnitPrice(base, [egg, rice]) === bahtToSatang(70), "unit");
assert(calcLineTotal(base, [egg, rice], 2) === bahtToSatang(140), "line");
assert(calcOrderTotal([bahtToSatang(140), bahtToSatang(20)]) === bahtToSatang(160), "order");
assert(calcLineTotal(base, [0], 1) === base, "zero delta");

console.log("money.test.ts OK");
