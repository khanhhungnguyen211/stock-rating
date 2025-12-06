# ✅ Deployment Checklist

Checklist để đảm bảo deploy thành công trên Render.com

## Trước khi Deploy

- [ ] Code đã được push lên GitHub
- [ ] Đã test local với PostgreSQL (nếu có)
- [ ] Đã review các file cấu hình:
  - [ ] `render.yaml`
  - [ ] `prisma/schema.prisma` (đã chuyển sang PostgreSQL)
  - [ ] `package.json` (có `postinstall` script)
  - [ ] `vnstock_service/main.py` (CORS config)

## Trên Render Dashboard

### Database
- [ ] Tạo PostgreSQL database: `stock-rating-db`
- [ ] Copy Internal Database URL
- [ ] Database status: **Available**

### Python Service
- [ ] Tạo Web Service: `stock-rating-api`
- [ ] Root Directory: `vnstock_service`
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- [ ] Environment Variables:
  - [ ] `PORT`: `10000`
- [ ] Service status: **Live**
- [ ] Copy service URL

### Next.js Service
- [ ] Tạo Web Service: `stock-rating-web`
- [ ] Build Command: `npm install && npx prisma generate && npx prisma migrate deploy && npm run build`
- [ ] Start Command: `npm start`
- [ ] Environment Variables:
  - [ ] `DATABASE_URL`: (Internal Database URL)
  - [ ] `NODE_ENV`: `production`
  - [ ] `NEXT_PUBLIC_VNSTOCK_SERVICE_URL`: (Python service URL)
- [ ] Service status: **Live**

## Sau khi Deploy

### Kiểm tra Migration
- [ ] Vào Shell của `stock-rating-web`
- [ ] Chạy: `npx prisma migrate deploy` (nếu chưa tự động)
- [ ] Kiểm tra: `npx prisma studio` (nếu cần)

### Import Data
- [ ] Vào Shell của `stock-rating-web`
- [ ] Chạy: `npm run import:vnstock`
- [ ] Kiểm tra data đã import thành công

### Test App
- [ ] Truy cập URL của `stock-rating-web`
- [ ] Kiểm tra Market Indices hiển thị
- [ ] Kiểm tra Stock List hiển thị
- [ ] Click vào 1 stock để xem detail page
- [ ] Test search và filter

## Troubleshooting

Nếu có lỗi, kiểm tra:
- [ ] Build logs trên Render
- [ ] Runtime logs
- [ ] Environment variables đã set đúng
- [ ] Database connection string đúng
- [ ] Python service URL đúng và accessible

## Notes

- Free tier services có thể sleep sau 15 phút
- Lần đầu truy cập sau khi sleep sẽ mất 30-60 giây
- Database free tier có giới hạn 90MB

