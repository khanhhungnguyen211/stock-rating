# Báo Cáo Kiểm Tra Database - Stock Rating App

## BƯỚC 1 – QUÉT TOÀN BỘ REPO TÌM NƠI TRUY CẬP DATABASE

### 1) Database Client

**File:** `lib/prisma.ts`
- **Chức năng:** Prisma Client singleton instance
- **Type:** PrismaClient
- **Database:** SQLite (file: `./prisma/dev.db`)

### 2) Schema/Model

**File:** `prisma/schema.prisma`
- **Database:** SQLite
- **Models:**
  - `Stock` - Bảng duy nhất trong database

**Cấu trúc bảng Stock:**
```prisma
model Stock {
  id          Int      @id @default(autoincrement())
  symbol      String   @unique
  name        String
  sector      String
  price       Float
  eps         Float
  pe          Float
  roe         Float
  growth_rate Float
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

### 3) Files Thực Hiện Query DB

#### a) Trang Danh Sách Cổ Phiếu
**File:** `app/page.tsx`
- **Query:** `prisma.stock.findMany()`
- **Bảng:** `Stock`
- **Mục đích:** Lấy tất cả cổ phiếu, sắp xếp theo symbol
- **Dữ liệu trả về:** Array of Stock objects

#### b) Trang Chi Tiết Cổ Phiếu
**File:** `app/stocks/[symbol]/page.tsx`
- **Query:** `prisma.stock.findUnique()`
- **Bảng:** `Stock`
- **Where clause:** `{ symbol: params.symbol.toUpperCase() }`
- **Mục đích:** Lấy thông tin 1 cổ phiếu theo symbol
- **Dữ liệu trả về:** Single Stock object hoặc null

#### c) Trang Admin - Danh Sách
**File:** `app/admin/stocks/page.tsx`
- **Query:** `prisma.stock.findMany()`
- **Bảng:** `Stock`
- **Mục đích:** Hiển thị danh sách cổ phiếu trong admin

#### d) Trang Admin - CRUD Actions
**File:** `app/admin/stocks/actions.ts`
- **Queries:**
  - `prisma.stock.create()` - Thêm cổ phiếu mới
  - `prisma.stock.update()` - Cập nhật cổ phiếu
  - `prisma.stock.delete()` - Xóa cổ phiếu
- **Bảng:** `Stock`

#### e) Seed Script
**File:** `prisma/seed.ts`
- **Query:** `prisma.stock.upsert()`
- **Bảng:** `Stock`
- **Mục đích:** Seed dữ liệu mẫu (5 cổ phiếu: FPT, VCB, VNM, MWG, HPG)

---

## BƯỚC 2 – KIỂM TRA LUỒNG DỮ LIỆU CỦA MÀN CHI TIẾT CỔ PHIẾU

### File: `app/stocks/[symbol]/page.tsx`

### ✅ CÓ TRUY VẤN DATABASE

**Query Database:**
```typescript
const stock = await prisma.stock.findUnique({
  where: { symbol: params.symbol.toUpperCase() },
})
```

**Chi tiết:**
- **Query:** `findUnique` (SELECT WHERE symbol = ?)
- **Bảng:** `Stock`
- **Điều kiện:** `symbol = params.symbol.toUpperCase()`
- **Dữ liệu trả về:** 
  - Object Stock với các field: id, symbol, name, sector, price, eps, pe, roe, growth_rate, createdAt, updatedAt
  - Hoặc `null` nếu không tìm thấy

**Sử dụng dữ liệu từ DB:**
- Dữ liệu từ DB được dùng cho:
  1. **Thông tin cơ bản:** symbol, name, sector, price, eps, pe, roe, growth_rate
  2. **Block "Định giá":** price, eps, growth_rate, roe → tính toán valuation
  3. **Insights Engine:** price, eps, growth_rate, roe → evaluateStockInsights()

**Dữ liệu KHÔNG từ DB:**
- **Lịch sử giá (price history):** 
  - Ưu tiên: Lấy từ vnstock service (nếu service chạy)
  - Fallback: Mock data từ `mockPriceHistoryFromCurrentPrice()`
- **Khối lượng (volume history):**
  - Ưu tiên: Lấy từ vnstock service
  - Fallback: Random mock data
- **Chỉ số tài chính bổ sung:**
  - Ưu tiên: Lấy từ vnstock service (fundamentals)
  - Fallback: Không có (dùng giá trị từ DB: roe, eps, pe)

---

## BƯỚC 3 – XÁC ĐỊNH CHÍNH XÁC TABLE/BẢNG NÀO ĐANG ĐƯỢC DÙNG

### Bảng Đang Được Sử Dụng

#### ✅ `Stock` - ĐANG DÙNG

**Sử dụng trong:**
1. ✅ Trang danh sách (`app/page.tsx`) - `findMany()`
2. ✅ Trang chi tiết (`app/stocks/[symbol]/page.tsx`) - `findUnique()`
3. ✅ Trang admin (`app/admin/stocks/page.tsx`) - `findMany()`
4. ✅ Admin actions (`app/admin/stocks/actions.ts`) - `create()`, `update()`, `delete()`

**Fields được sử dụng trong trang chi tiết:**
- `symbol` - Hiển thị mã cổ phiếu
- `name` - Tên công ty
- `sector` - Ngành
- `price` - Giá hiện tại (dùng cho valuation, insights)
- `eps` - EPS (dùng cho valuation, insights)
- `pe` - P/E hiện tại (hiển thị)
- `roe` - ROE (dùng cho valuation, insights)
- `growth_rate` - Tăng trưởng (dùng cho valuation, insights)

**Fields KHÔNG được sử dụng trong trang chi tiết:**
- `id` - Chỉ dùng trong admin (update/delete)
- `createdAt` - Không hiển thị
- `updatedAt` - Không hiển thị

### Bảng KHÔNG TỒN TẠI (Chưa có trong schema)

#### ❌ `StockPriceHistory` - CHƯA CÓ
- **Mục đích:** Lưu lịch sử giá cổ phiếu
- **Hiện tại:** Dùng vnstock service hoặc mock data
- **Cần thiết:** Có thể tạo sau để lưu dữ liệu từ vnstock

#### ❌ `StockInsight` - CHƯA CÓ
- **Mục đích:** Lưu kết quả insight đã tính toán
- **Hiện tại:** Tính toán real-time mỗi lần load trang
- **Cần thiết:** Có thể cache để tối ưu performance

---

## BƯỚC 4 – DB TRACE POINT

### Đã thêm vào `app/stocks/[symbol]/page.tsx`

**Vị trí:** Dòng 20-37

**Code:**
```typescript
// [DB-DEBUG] Query database để lấy thông tin cổ phiếu
const stock = await prisma.stock.findUnique({
  where: { symbol: params.symbol.toUpperCase() },
})

// [DB-DEBUG] Log dữ liệu từ database
console.log('[DB-DEBUG] Stock query result:', {
  symbol: params.symbol.toUpperCase(),
  found: !!stock,
  data: stock
    ? {
        id: stock.id,
        symbol: stock.symbol,
        name: stock.name,
        price: stock.price,
        eps: stock.eps,
        roe: stock.roe,
        growth_rate: stock.growth_rate,
      }
    : null,
})

if (!stock) {
  console.log('[DB-DEBUG] Stock not found in database, calling notFound()')
  notFound()
}
```

**Cách xem log:**
- Mở terminal chạy `npm run dev`
- Khi vào trang chi tiết cổ phiếu, xem console output
- Sẽ thấy log: `[DB-DEBUG] Stock query result: {...}`

---

## TÓM TẮT

### Database Structure
- **1 bảng:** `Stock`
- **Database:** SQLite (local file)
- **ORM:** Prisma

### Trang Chi Tiết Cổ Phiếu
- ✅ **CÓ truy vấn DB:** `prisma.stock.findUnique()`
- ✅ **Bảng:** `Stock`
- ✅ **Dữ liệu từ DB:** Thông tin cơ bản cổ phiếu (symbol, name, price, eps, pe, roe, growth_rate)
- ⚠️ **Dữ liệu KHÔNG từ DB:** Lịch sử giá (từ vnstock hoặc mock), chỉ số tài chính bổ sung (từ vnstock)

### Các Query Khác
- Trang danh sách: `findMany()` - Lấy tất cả cổ phiếu
- Admin: `create()`, `update()`, `delete()` - CRUD operations

### DB Trace Points
- ✅ Đã thêm console.log với prefix `[DB-DEBUG]` trong trang chi tiết
- Log sẽ hiển thị: symbol query, found status, và dữ liệu trả về

