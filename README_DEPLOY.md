# 🚀 Quick Start - Deploy lên Render.com

## Bước nhanh (5 phút)

### 1. Push code lên GitHub
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### 2. Tạo services trên Render.com

#### A. PostgreSQL Database
1. Vào [Render Dashboard](https://dashboard.render.com)
2. **New +** → **PostgreSQL**
3. Name: `stock-rating-db`
4. Plan: **Free**
5. Click **Create**
6. Copy **Internal Database URL**

#### B. Python API Service
1. **New +** → **Web Service**
2. Connect GitHub repo
3. Settings:
   - Name: `stock-rating-api`
   - Root Directory: `vnstock_service`
   - Build: `pip install -r requirements.txt`
   - Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - Environment: `Python 3`
4. Environment Variables:
   - `PORT`: `10000`
5. Click **Create**
6. Copy service URL (ví dụ: `https://stock-rating-api.onrender.com`)

#### C. Next.js Web App
1. **New +** → **Web Service**
2. Connect cùng GitHub repo
3. Settings:
   - Name: `stock-rating-web`
   - Build: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
   - Start: `npm start`
   - Environment: `Node`
4. Environment Variables:
   - `DATABASE_URL`: (paste Internal Database URL từ bước A)
   - `NODE_ENV`: `production`
   - `NEXT_PUBLIC_VNSTOCK_SERVICE_URL`: (paste URL từ bước B)
5. Click **Create**

### 3. Chạy Migration
Sau khi deploy xong, vào **Shell** của `stock-rating-web`:
```bash
npx prisma migrate deploy
npm run import:vnstock
```

### 4. Done! 🎉
Truy cập URL của `stock-rating-web` để xem app.

---

📖 Xem **DEPLOY.md** để biết chi tiết và troubleshooting.

