# Stock Valuation App

Ứng dụng web định giá và phân tích cổ phiếu được xây dựng với Next.js, TypeScript, Prisma và TailwindCSS.

## Tính năng

- 📊 **Danh sách cổ phiếu**: Hiển thị bảng các cổ phiếu với thông tin định giá, score và trạng thái
- 📈 **Chi tiết cổ phiếu**: Xem thông tin chi tiết và nhận xét tự động về định giá
- ⚙️ **Quản lý cổ phiếu**: Thêm, sửa, xóa cổ phiếu (Admin)

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: SQLite với Prisma ORM
- **Styling**: TailwindCSS
- **Deployment**: Vercel-ready

## Cài đặt và chạy project

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Thiết lập database

```bash
# Tạo database và chạy migration
npx prisma migrate dev --name init

# Seed dữ liệu mẫu (5 cổ phiếu: FPT, VCB, VNM, MWG, HPG)
npm run db:seed
```

### 3. Chạy development server

```bash
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem ứng dụng.

## Cấu trúc project

```
stock-rating/
├── app/                      # Next.js App Router
│   ├── admin/
│   │   └── stocks/          # Trang quản lý cổ phiếu
│   ├── stocks/
│   │   └── [symbol]/        # Trang chi tiết cổ phiếu
│   ├── layout.tsx           # Root layout
│   ├── page.tsx             # Trang danh sách cổ phiếu
│   └── globals.css          # Global styles
├── lib/
│   ├── prisma.ts            # Prisma client instance
│   └── valuation.ts         # Logic định giá (PE fair, fair value, discount, score)
├── prisma/
│   ├── schema.prisma        # Prisma schema
│   └── seed.ts              # Seed script
└── package.json
```

## Logic định giá

### Công thức

- **PE hợp lý**: `pe_fair = 8 + growth_rate`
- **Giá trị hợp lý**: `fair_value = eps * pe_fair`
- **Chênh lệch**: `discount = (fair_value - price) / fair_value`
- **Score (0-100)**:
  - Nếu `discount > 0`: `score = min(100, 50 + discount * 100)`
  - Nếu `discount ≤ 0`: `score = max(0, 50 + discount * 100)`

### Status Tag

- `discount > 0.2` → **"Rẻ"** (màu xanh)
- `0 < discount ≤ 0.2` → **"Hợp lý"** (màu xám)
- `discount ≤ 0` → **"Đắt"** (màu đỏ)

### Nhận xét tự động

- `discount > 0.2`: "Định giá hấp dẫn cho nhà đầu tư dài hạn, có thể cân nhắc giải ngân dần."
- `0 < discount ≤ 0.2`: "Giá đang ở vùng hợp lý, phù hợp để tích lũy từ từ nếu tin vào tăng trưởng doanh nghiệp."
- `discount ≤ 0`: "Cổ phiếu đang được định giá cao so với ước tính, nên thận trọng trước khi mua mới."

## Scripts

- `npm run dev` - Chạy development server
- `npm run build` - Build production
- `npm run start` - Chạy production server
- `npm run db:push` - Push schema changes to database
- `npm run db:migrate` - Tạo migration mới
- `npm run db:seed` - Seed dữ liệu mẫu
- `npm run db:studio` - Mở Prisma Studio (GUI để xem/chỉnh sửa database)

## Triển khai lên Vercel

1. Push code lên GitHub
2. Import project vào Vercel
3. Vercel sẽ tự động detect Next.js và build
4. **Lưu ý**: SQLite không phù hợp cho production trên Vercel (serverless). Nên chuyển sang PostgreSQL hoặc MySQL khi deploy production.

## Database Schema

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

## License

MIT

