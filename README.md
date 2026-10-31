# ชานา OMS (chana-pos)

ระบบจัดการออเดอร์ร้านข้าว — พนักงานคีย์ออเดอร์จาก LINE เอง เลือกเมนู+ท็อปปิ้ง คำนวณยอดอัตโนมัติ อัปเดตสถานะบนมือถือ และดูรายงานยอดขาย

**สแต็ก:** Next.js (App Router) · Bun · TypeScript · Tailwind · Drizzle · MariaDB  
**ภาษา UI:** ไทย · **เงิน:** THB (เก็บเป็นสตางค์)  
**Auth:** username + password บัญชีแยกกัน (ไม่มี roles)

---

## รันแบบ Local

### 1) เตรียม MariaDB

```bash
# ตัวอย่างด้วย docker compose (เฉพาะ DB)
docker compose up -d db
```

หรือใช้ MariaDB ที่มีอยู่แล้ว แล้วสร้าง database/user ตาม `.env.example`

### 2) ตั้งค่า env

```bash
cp .env.example .env
# แก้ DATABASE_URL และ SESSION_SECRET (≥ 32 ตัวอักษร)
```

### 3) ติดตั้ง + migrate + seed

```bash
bun install
bun run db:migrate   # หรือ bun run db:push ตอนพัฒนา
bun run db:seed      # สร้าง user staff / staff1234 + เมนูตัวอย่าง
```

### 4) เปิดแอป

```bash
bun run dev
# เปิด http://localhost:3000
# ล็อกอิน: staff / staff1234
```

---

## กติคาราคา (สำคัญ)

```
ราคาต่อหน่วย = base_price + sum(price_delta ของ option ที่ติ๊ก)
ยอดบรรทัด   = ราคาต่อหน่วย × qty
ยอดออเดอร์  = sum(ยอดบรรทัด)
```

**ไม่มีช่องค่าส่งแยก** — ร้านสร้างสินค้า/option ค่าส่ง แล้วพนักงานติ๊กตอนคีย์

สถานะออเดอร์: `new → preparing → ready → out_for_delivery → delivered`  
รายงานยอดขายนับเฉพาะสถานะ **delivered**

---

## Deploy: Coolify + Cloudflare Tunnel

1. สร้าง **MariaDB** บน Coolify (timezone `Asia/Bangkok`)
2. Deploy แอปจาก Git ด้วย **Dockerfile** ในรีโปนี้
3. ตั้ง env:
   - `DATABASE_URL=mysql://user:pass@<mariadb-host>:3306/<db>`
   - `SESSION_SECRET=<สุ่มยาว ≥32>`
   - `TZ=Asia/Bangkok`
4. หลัง deploy รัน migration ครั้งแรก เช่น release command:
   ```bash
   bun run db:migrate && bun run db:seed
   ```
   (หรือรัน seed ครั้งเดียวด้วย one-shot)
5. ผูก **Cloudflare Tunnel** hostname → พอร์ต HTTP ของแอปใน Coolify  
   ไม่ต้องเปิดพอร์ตบ้านตรง ๆ
6. สำรอง MariaDB รายวัน (`mariadb-dump` / ฟีเจอร์ backup ของ Coolify) เก็บอย่างน้อย 7–14 วัน

`docker-compose.yml` มีทั้ง MariaDB + แอป สำหรับทดสอบบนเครื่อง/เซิร์ฟเวอร์ที่รัน Compose ได้

---

## โครงหลัก

```
app/(auth)/login
app/(app)/orders        # รายการวันนี้ + ปุ่มสถานะ
app/(app)/orders/new    # คีย์ออเดอร์
app/(app)/customers
app/(app)/products      # หมวด / สินค้า / option groups
app/(app)/reports
db/schema.ts
db/migrations/
lib/money.ts            # คำนวณสตางค์
```

---

## สคริปต์

| คำสั่ง | ความหมาย |
|--------|----------|
| `bun run dev` | พัฒนา |
| `bun run build` / `start` | โปรดักชัน |
| `bun run db:generate` | สร้าง migration จาก schema |
| `bun run db:migrate` | รัน migration |
| `bun run db:push` | sync schema ตอนพัฒนา |
| `bun run db:seed` | user + เมนูตัวอย่าง |

---

## นอกขอบเขต v1

ไม่มี LINE bot, หน้าสั่งของลูกค้า, ชำระเงินออนไลน์, KDS, โต๊ะ dine-in, ภาษี/ใบเสร็จ, สถานะ Cancelled
