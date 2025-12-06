# Báo Cáo Nguồn Dữ Liệu - Stock Rating App

## BƯỚC 1 – XÁC ĐỊNH LỚP DATABASE VÀ BẢNG CỔ PHIẾU

### Database & ORM
- **Database:** SQLite
- **ORM:** Prisma
- **File kết nối DB:** `lib/prisma.ts`
- **File schema:** `prisma/schema.prisma`

### Model Stock

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

### Bảng KHÔNG có trong schema
- ❌ `StockPriceHistory` - Chưa có (hiện dùng vnstock service hoặc mock)
- ❌ `StockFundamental` - Chưa có (hiện dùng vnstock service)

---

## BƯỚC 2 – KIỂM TRA TÍCH HỢP VNSTOCK HIỆN CÓ

### ✅ ĐÃ CÓ TÍCH HỢP VNSTOCK

**Python Service:**
- **File:** `vnstock_service/main.py`
- **Base URL:** `http://localhost:8000`
- **Endpoints:**
  1. `GET /api/stock/{symbol}/price-history`
     - Trả về: Array các record với date, open, close, high, low, volume
  2. `GET /api/stock/{symbol}/fundamentals`
     - Trả về: `{ overview: [...], ratios: [...] }`

**TypeScript Client:**
- **File:** `lib/vnstockClient.ts`
- **Functions:**
  - `fetchVnstockPriceHistory()` - Lấy lịch sử giá
  - `fetchVnstockFundamentals()` - Lấy chỉ số tài chính

---

## BƯỚC 3 – ETL: ĐỔ DATA VNSTOCK VÀO DB

### ✅ ĐÃ TẠO SCRIPT ETL

**File:** `scripts/importStocksFromVnstock.ts`

**Chức năng:**
- Import dữ liệu từ VNStock service vào bảng `Stock`
- Danh sách mã test: `['MWG', 'FPT', 'VNM', 'VCB', 'HPG']`
- Với mỗi symbol:
  - Lấy price history → extract giá hiện tại
  - Lấy fundamentals → extract EPS, P/E, ROE, tên công ty, ngành
  - Tính tăng trưởng từ EPS (nếu có nhiều năm)
  - Upsert vào DB (update nếu đã có, create nếu chưa có)

**Cách chạy:**
```bash
# Đảm bảo VNStock service đang chạy tại http://localhost:8000

# Import tất cả mã phổ biến (khoảng 60+ mã)
npm run import:vnstock

# Hoặc import chỉ một số mã cụ thể
npm run import:vnstock -- MWG FPT VNM VCB HPG

# Hoặc dùng format --symbols=
npm run import:vnstock -- --symbols=MWG,FPT,VNM,VCB,HPG

# Hoặc chạy trực tiếp
npx tsx scripts/importStocksFromVnstock.ts
```

**Danh sách mã mặc định:**
- Script mặc định sẽ import khoảng **60+ mã cổ phiếu** phổ biến, bao gồm:
  - VN30 (top 30 mã vốn hóa lớn nhất)
  - HNX30 (top 30 mã trên sàn HNX)
  - Các mã blue-chip khác
- Bạn có thể chỉ định mã cụ thể qua command line arguments nếu chỉ muốn import một số mã nhất định.

**Error handling:**
- Không crash nếu 1 symbol bị lỗi
- Log chi tiết từng bước
- Tóm tắt kết quả cuối cùng

---

## BƯỚC 4 – TRANG DANH SÁCH CỔ PHIẾU

### ✅ ĐÃ LẤY TỪ DATABASE

**File:** `app/page.tsx`

**Query:**
```typescript
const stocks = await prisma.stock.findMany({
  orderBy: { symbol: 'asc' },
})
```

**Hiển thị:**
- Symbol
- Tên công ty
- Ngành
- Giá (VND)
- Giá trị hợp lý (tính từ DB data)
- Score (tính từ DB data)
- Trạng thái (tính từ DB data)

**Empty State:**
- ✅ Đã thêm empty state khi DB chưa có data
- Hiển thị hướng dẫn chạy script import

**Không còn:**
- ❌ Hard-code list cổ phiếu
- ❌ Mock data trong component

---

## BƯỚC 5 – TRANG CHI TIẾT CỔ PHIẾU

### ✅ ĐÃ LẤY TỪ DATABASE

**File:** `app/stocks/[symbol]/page.tsx`

**Query:**
```typescript
const stock = await prisma.stock.findUnique({
  where: { symbol: params.symbol.toUpperCase() },
})
```

**Dữ liệu từ DB được dùng cho:**

1. **Thông tin cơ bản:**
   - Symbol, name, sector → từ `stock`
   - Giá hiện tại → từ `stock.price`
   - EPS → từ `stock.eps`
   - P/E → từ `stock.pe`
   - ROE → từ `stock.roe`
   - Tăng trưởng → từ `stock.growth_rate`

2. **Block "Định giá":**
   - Dùng `stock.price`, `stock.eps`, `stock.growth_rate`, `stock.roe`
   - Tính toán qua `evaluateStockInsights()`

3. **Phân tích Insight:**
   - Valuation: Dùng data từ DB
   - Trend: Dùng price history từ vnstock (nếu có) hoặc mock
   - Risk: Dùng price history từ vnstock (nếu có) hoặc mock
   - Fundamental: Dùng `stock.roe` từ DB, có thể bổ sung từ vnstock

**Dữ liệu KHÔNG từ DB (tạm thời):**
- ⚠️ **Price history:** Từ vnstock service hoặc mock (chưa có bảng `StockPriceHistory`)
- ⚠️ **Volume history:** Từ vnstock service hoặc mock
- ⚠️ **Chỉ số tài chính bổ sung:** Từ vnstock service (epsGrowth3Y, revenueGrowth3Y, debtToEquity)

**TODO trong code:**
- Dòng 78: `// TODO: lưu lịch sử giá vào DB sau.`

---

## BƯỚC 6 – TÓM TẮT

### Database & Model

**Database:** SQLite (`./prisma/dev.db`)  
**ORM:** Prisma  
**Model:** `Stock` (bảng duy nhất)

**Cấu trúc bảng Stock:**
- `id`, `symbol` (unique), `name`, `sector`
- `price`, `eps`, `pe`, `roe`, `growth_rate`
- `createdAt`, `updatedAt`

### Script Import Data

**File:** `scripts/importStocksFromVnstock.ts`  
**Cách chạy:** `npm run import:vnstock`  
**Chức năng:** Import dữ liệu từ VNStock service vào bảng `Stock`

### Trang Danh Sách Cổ Phiếu

**File:** `app/page.tsx`  
**Query:** `prisma.stock.findMany({ orderBy: { symbol: 'asc' } })`  
**Nguồn dữ liệu:** ✅ 100% từ Database  
**Empty state:** ✅ Có hiển thị khi DB trống

### Trang Chi Tiết Cổ Phiếu

**File:** `app/stocks/[symbol]/page.tsx`  
**Query:** `prisma.stock.findUnique({ where: { symbol } })`  
**Nguồn dữ liệu:**
- ✅ **Thông tin cơ bản:** 100% từ Database
- ✅ **Block "Định giá":** 100% từ Database
- ✅ **Insights (Valuation, Fundamental):** Dùng data từ Database
- ⚠️ **Insights (Trend, Risk):** Dùng price history từ vnstock service (fallback mock nếu service không chạy)

### Các Chỗ Còn Dùng Mock Data

1. **Price History cho Insights:**
   - File: `app/stocks/[symbol]/page.tsx` (dòng 91-96)
   - Lý do: Chưa có bảng `StockPriceHistory` trong DB
   - Giải pháp tạm: Dùng vnstock service hoặc mock
   - TODO: Lưu price history vào DB sau

2. **Price Chart Component:**
   - File: `app/components/PriceChart.tsx`
   - Lý do: Component demo chart, không ảnh hưởng logic chính
   - Có thể giữ nguyên hoặc cải thiện sau

### Kết Luận

✅ **Thông tin cơ bản cổ phiếu:** 100% từ Database  
✅ **Danh sách cổ phiếu:** 100% từ Database  
✅ **Trang chi tiết:** Thông tin cơ bản 100% từ Database  
⚠️ **Price history:** Từ vnstock service (có thể lưu vào DB sau)  
✅ **ETL Script:** Đã sẵn sàng để import data từ vnstock vào DB

---

## Hướng Dẫn Sử Dụng

### 1. Import dữ liệu từ VNStock vào DB

```bash
# Bước 1: Chạy VNStock service (terminal 1)
cd vnstock_service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Bước 2: Import data (terminal 2)
npm run import:vnstock
```

### 2. Kiểm tra dữ liệu trong DB

```bash
# Mở Prisma Studio
npm run db:studio
```

### 3. Chạy web app

```bash
npm run dev
```

Truy cập http://localhost:3000 để xem danh sách cổ phiếu từ DB.

