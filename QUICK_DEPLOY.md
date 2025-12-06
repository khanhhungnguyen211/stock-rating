# 🚀 Quick Deploy Guide

## Bước 1: Tạo GitHub Repository

1. Vào https://github.com/new
2. Repository name: `stock-rating`
3. **KHÔNG** check "Add a README file", "Add .gitignore", hoặc "Choose a license"
4. Click "Create repository"

## Bước 2: Push Code lên GitHub

Chạy script tự động:

```bash
./deploy.sh YOUR_GITHUB_USERNAME
```

Hoặc làm manual:

```bash
git remote add origin https://github.com/YOUR_USERNAME/stock-rating.git
git branch -M main
git push -u origin main
```

## Bước 3: Deploy lên Render.com

Xem file `README_DEPLOY.md` hoặc `DEPLOY.md` để biết chi tiết.

Hoặc làm theo checklist trong `CHECKLIST_DEPLOY.md`
