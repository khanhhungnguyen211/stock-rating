# 🏠 Local Development Guide

Hướng dẫn chạy project trên máy local để test trước khi deploy.

## 📋 Yêu cầu

- Node.js 18+ 
- Python 3.12+
- npm hoặc yarn

## 🚀 Quick Start

### Cách 1: Dùng script tự động (Khuyến nghị)

```bash
# 1. Cho phép script chạy
chmod +x start-local.sh

# 2. Chạy script
./start-local.sh
```

Script sẽ tự động:
- ✅ Tạo `.env.local` nếu chưa có
- ✅ Setup Python venv nếu chưa có
- ✅ Install dependencies nếu chưa có
- ✅ Generate Prisma Client
- ✅ Start Python service (port 8000)
- ✅ Start Next.js dev server (port 3000)

### Cách 2: Chạy thủ công

#### Bước 1: Setup Environment

```bash
# Copy .env.local.example
cp .env.local.example .env.local

# Edit .env.local với database URL của bạn
# Option A: SQLite (đơn giản)
DATABASE_URL="file:./dev.db"

# Option B: PostgreSQL từ Render (giống production)
DATABASE_URL="postgresql://user:password@host:port/database"
```

#### Bước 2: Setup Database

**Nếu dùng SQLite:**
```bash
# Đổi schema về SQLite (tạm thời)
# Mở prisma/schema.prisma, đổi:
# provider = "sqlite"
# url = "file:./dev.db"

# Tạo database
npx prisma migrate dev --name init
npx prisma generate
```

**Nếu dùng PostgreSQL:**
```bash
# Chạy migration
npx prisma migrate deploy
npx prisma generate
```

#### Bước 3: Start Python Service

```bash
cd vnstock_service
source venv/bin/activate  # hoặc: python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Service chạy tại: `http://localhost:8000`

#### Bước 4: Start Next.js

```bash
# Terminal mới
npm install
npm run dev
```

App chạy tại: `http://localhost:3000`

## 📱 Test trên Mobile

### Cách 1: Chrome DevTools (Nhanh nhất)

1. Mở `http://localhost:3000` trên Chrome
2. Nhấn `F12` hoặc `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows)
3. Click icon mobile (hoặc `Cmd+Shift+M` / `Ctrl+Shift+M`)
4. Chọn device (iPhone, Android, v.v.)
5. Test responsive UI

### Cách 2: Test trên điện thoại thật

1. **Tìm IP local của máy:**
   ```bash
   # Mac/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   # Hoặc
   ipconfig getifaddr en0
   
   # Windows
   ipconfig | findstr IPv4
   ```

2. **Update Next.js để chạy với host 0.0.0.0:**
   ```bash
   # Sửa package.json script "dev" thành:
   "dev": "next dev -H 0.0.0.0"
   ```

3. **Trên điện thoại (cùng WiFi), mở:**
   ```
   http://[YOUR_IP]:3000
   ```
   Ví dụ: `http://192.168.1.100:3000`

### Cách 3: Dùng ngrok (Test từ xa)

```bash
# Cài ngrok
brew install ngrok  # Mac
# hoặc download từ https://ngrok.com

# Tạo tunnel
ngrok http 3000

# Copy URL ngrok và mở trên điện thoại
```

## 📊 Import Data

Sau khi services đã chạy, import dữ liệu:

```bash
# Import stocks từ vnstock
npm run import:vnstock

# Hoặc update fundamentals
npm run update:fundamentals
```

## 🛠️ Scripts hữu ích

```bash
# Development
npm run dev              # Start Next.js dev server
npm run dev:clean        # Clean cache và start dev

# Database
npm run db:push          # Push schema changes
npm run db:migrate       # Create migration
npm run db:seed          # Seed sample data
npm run db:studio        # Open Prisma Studio (GUI)

# Import/Update
npm run import:vnstock   # Import stocks from vnstock
npm run update:fundamentals  # Update fundamentals

# Build
npm run build            # Build production
npm run build:clean      # Clean cache và build
```

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra `DATABASE_URL` trong `.env.local`
- Đảm bảo database đã được tạo
- Chạy `npx prisma generate`

### Lỗi: "Failed to fetch from vnstock service"
- Kiểm tra Python service có đang chạy tại `http://localhost:8000`
- Kiểm tra `NEXT_PUBLIC_VNSTOCK_SERVICE_URL` trong `.env.local`

### Lỗi: "Module not found"
- Chạy `npm install`
- Chạy `npm run clean` và `npm run dev:clean`

### Python service không start
- Kiểm tra venv: `cd vnstock_service && source venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`
- Kiểm tra port 8000 có bị chiếm không: `lsof -i :8000`

## 📝 Notes

- **Hot Reload**: Next.js tự động reload khi code thay đổi
- **Python Service**: Cần chạy riêng trong terminal hoặc background
- **Database**: SQLite đơn giản hơn cho local dev, PostgreSQL giống production hơn
- **Environment**: `.env.local` không được commit vào git (đã có trong .gitignore)

## 🎯 Next Steps

Sau khi test local xong:
1. Commit changes
2. Push lên GitHub
3. Render sẽ tự động deploy

