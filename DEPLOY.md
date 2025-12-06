# Hướng dẫn Deploy lên Render.com

Hướng dẫn chi tiết để deploy ứng dụng Stock Rating lên Render.com.

## 📋 Yêu cầu

1. Tài khoản GitHub (để push code)
2. Tài khoản Render.com (miễn phí)
3. Code đã được push lên GitHub repository

## 🚀 Bước 1: Chuẩn bị Code

### 1.1. Push code lên GitHub

```bash
# Nếu chưa có git repo
git init
git add .
git commit -m "Initial commit"

# Tạo repo trên GitHub, sau đó:
git remote add origin https://github.com/YOUR_USERNAME/stock-rating.git
git push -u origin main
```

### 1.2. Kiểm tra các file cần thiết

Đảm bảo có các file sau:
- ✅ `render.yaml` (đã có)
- ✅ `prisma/schema.prisma` (đã cập nhật cho PostgreSQL)
- ✅ `vnstock_service/requirements.txt`
- ✅ `.env.example`

## 🗄️ Bước 2: Deploy Database (PostgreSQL)

### 2.1. Tạo PostgreSQL Database trên Render

1. Đăng nhập vào [Render Dashboard](https://dashboard.render.com)
2. Click **"New +"** → **"PostgreSQL"**
3. Điền thông tin:
   - **Name**: `stock-rating-db`
   - **Database**: `stock_rating`
   - **User**: `stock_rating_user`
   - **Region**: Chọn gần bạn nhất
   - **Plan**: Free
4. Click **"Create Database"**
5. Chờ database được tạo (1-2 phút)
6. Copy **Internal Database URL** (sẽ dùng sau)

## 🐍 Bước 3: Deploy Python Service (vnstock_service)

### 3.1. Tạo Web Service cho Python API

1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Kết nối GitHub repository của bạn
3. Điền thông tin:
   - **Name**: `stock-rating-api`
   - **Environment**: `Python 3`
   - **Region**: Cùng region với database
   - **Branch**: `main`
   - **Root Directory**: `vnstock_service`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Thêm Environment Variables:
   - `PORT`: `10000`
   - `PYTHON_VERSION`: `3.12.0`
5. Click **"Create Web Service"**
6. Chờ deploy xong (3-5 phút)
7. Copy **Service URL** (ví dụ: `https://stock-rating-api.onrender.com`)

### 3.2. Cập nhật CORS (nếu cần)

Nếu có lỗi CORS, cập nhật `vnstock_service/main.py`:

```python
# Thay vì allow_origins=["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://stock-rating-web.onrender.com",  # URL của Next.js app
        "http://localhost:3000",  # Cho local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## ⚛️ Bước 4: Deploy Next.js App

### 4.1. Tạo Web Service cho Next.js

1. Trong Render Dashboard, click **"New +"** → **"Web Service"**
2. Kết nối cùng GitHub repository
3. Điền thông tin:
   - **Name**: `stock-rating-web`
   - **Environment**: `Node`
   - **Region**: Cùng region với database
   - **Branch**: `main`
   - **Root Directory**: `.` (root của project)
   - **Build Command**: 
     ```bash
     npm install && npx prisma generate && npx prisma migrate deploy && npm run build
     ```
   - **Start Command**: `npm start`
4. Thêm Environment Variables:
   - `DATABASE_URL`: Paste Internal Database URL từ bước 2.1
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_VNSTOCK_SERVICE_URL`: URL của Python service (bước 3.1)
5. Click **"Create Web Service"**
6. Chờ deploy xong (5-10 phút)

## 📊 Bước 5: Chạy Migration và Seed Data

### 5.1. Chạy Migration

Sau khi Next.js app deploy xong, migration sẽ tự động chạy trong build command. Nếu cần chạy manual:

```bash
# Option 1: Dùng Render Shell
# Vào Render Dashboard → stock-rating-web → Shell
npx prisma migrate deploy

# Option 2: Chạy local với DATABASE_URL từ Render
# Copy Internal Database URL từ Render
export DATABASE_URL="postgresql://..."
npx prisma migrate deploy
```

**Lưu ý**: Migration đã được include trong build command, nên thường không cần chạy manual.

### 5.2. Import dữ liệu cổ phiếu

Sau khi migration xong, import dữ liệu:

```bash
# Option 1: Dùng Render Shell
npm run import:vnstock

# Option 2: Chạy local
export DATABASE_URL="postgresql://..."
export NEXT_PUBLIC_VNSTOCK_SERVICE_URL="https://stock-rating-api.onrender.com"
npm run import:vnstock
```

## ✅ Bước 6: Kiểm tra

1. Truy cập URL của Next.js app (ví dụ: `https://stock-rating-web.onrender.com`)
2. Kiểm tra:
   - ✅ Market Indices hiển thị
   - ✅ Stock list hiển thị
   - ✅ Click vào stock để xem detail page

## 🔧 Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra `DATABASE_URL` đúng chưa
- Đảm bảo dùng **Internal Database URL** (không phải External)

### Lỗi: "Failed to fetch index data"
- Kiểm tra `NEXT_PUBLIC_VNSTOCK_SERVICE_URL` đúng chưa
- Kiểm tra Python service đang chạy
- Kiểm tra CORS settings

### Lỗi: "Prisma Client not generated"
- Chạy `npx prisma generate` trong build command
- Hoặc chạy manual trong Render Shell

### Python service bị sleep (Free tier)
- Render free tier sẽ sleep sau 15 phút không dùng
- Lần đầu truy cập sẽ mất 30-60 giây để wake up
- Có thể upgrade lên paid plan để tránh sleep

## 📝 Notes

- **Free tier limitations**:
  - Services có thể sleep sau 15 phút không dùng
  - Database có giới hạn 90MB
  - Build time có thể lâu hơn

- **Production recommendations**:
  - Upgrade database lên paid plan nếu có nhiều data
  - Setup monitoring và alerts
  - Backup database định kỳ

## 🔗 Links hữu ích

- [Render Documentation](https://render.com/docs)
- [Prisma with PostgreSQL](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
- [Next.js Deployment](https://nextjs.org/docs/deployment)

