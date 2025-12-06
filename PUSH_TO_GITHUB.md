# 📤 Hướng dẫn Push Code lên GitHub

## Bước 1: Tạo Repository trên GitHub

1. Vào https://github.com/new
2. Repository name: `stock-rating`
3. **KHÔNG** check các options:
   - ❌ Add a README file
   - ❌ Add .gitignore
   - ❌ Choose a license
4. Click **"Create repository"**

## Bước 2: Setup Authentication

### Option A: Dùng Personal Access Token (Khuyến nghị)

1. Vào https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Đặt tên: `stock-rating-deploy`
4. Chọn scopes: ✅ **repo** (full control)
5. Click **"Generate token"**
6. **Copy token** (chỉ hiện 1 lần!)

### Option B: Dùng SSH Key

Nếu bạn đã có SSH key setup, dùng:
```bash
git remote set-url origin git@github.com:khanhhungnguyen211/stock-rating.git
```

## Bước 3: Push Code

### Nếu dùng Personal Access Token:

```bash
# Khi git hỏi username: nhập khanhhungnguyen211
# Khi git hỏi password: paste Personal Access Token (không phải password GitHub)
git push -u origin main
```

### Hoặc set token trong URL:

```bash
# Thay YOUR_TOKEN bằng token bạn vừa tạo
git remote set-url origin https://YOUR_TOKEN@github.com/khanhhungnguyen211/stock-rating.git
git push -u origin main
```

## Bước 4: Verify

Kiểm tra trên GitHub:
- Vào https://github.com/khanhhungnguyen211/stock-rating
- Xem code đã được push chưa

---

Sau khi push xong, tiếp tục với **DEPLOY.md** để deploy lên Render.com

