#!/bin/bash

# Script tự động deploy lên GitHub và Render.com
# Usage: ./deploy.sh YOUR_GITHUB_USERNAME

set -e

GITHUB_USERNAME=$1

if [ -z "$GITHUB_USERNAME" ]; then
    echo "❌ Usage: ./deploy.sh YOUR_GITHUB_USERNAME"
    echo "   Ví dụ: ./deploy.sh john-doe"
    exit 1
fi

REPO_NAME="stock-rating"
GITHUB_REPO="https://github.com/${GITHUB_USERNAME}/${REPO_NAME}.git"

echo "🚀 Bắt đầu deploy process..."

# Kiểm tra git status
if [ -z "$(git status --porcelain)" ]; then
    echo "✅ Working directory clean"
else
    echo "📝 Có thay đổi chưa commit, đang commit..."
    git add .
    git commit -m "Update before deployment"
fi

# Kiểm tra remote
if git remote | grep -q "^origin$"; then
    echo "✅ Remote 'origin' đã tồn tại"
    CURRENT_REMOTE=$(git remote get-url origin)
    echo "   Current: $CURRENT_REMOTE"
    read -p "Bạn có muốn thay đổi remote URL? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git remote set-url origin "$GITHUB_REPO"
        echo "✅ Đã cập nhật remote URL"
    fi
else
    echo "➕ Thêm remote 'origin'..."
    git remote add origin "$GITHUB_REPO"
    echo "✅ Đã thêm remote"
fi

# Push lên GitHub
echo ""
echo "📤 Đang push code lên GitHub..."
echo "   Repo: $GITHUB_REPO"
echo ""
echo "⚠️  Nếu repo chưa tồn tại trên GitHub:"
echo "   1. Vào https://github.com/new"
echo "   2. Tạo repo tên: $REPO_NAME"
echo "   3. KHÔNG tạo README, .gitignore, hoặc license"
echo "   4. Nhấn Enter sau khi tạo xong..."
read -p ""

git branch -M main
git push -u origin main

echo ""
echo "✅ Đã push code lên GitHub!"
echo ""
echo "🌐 Bước tiếp theo - Deploy lên Render.com:"
echo ""
echo "1. Vào https://dashboard.render.com"
echo "2. Click 'New +' → 'PostgreSQL'"
echo "   - Name: stock-rating-db"
echo "   - Plan: Free"
echo "   - Click 'Create'"
echo "   - Copy 'Internal Database URL'"
echo ""
echo "3. Click 'New +' → 'Web Service' (Python)"
echo "   - Connect GitHub repo: $REPO_NAME"
echo "   - Name: stock-rating-api"
echo "   - Root Directory: vnstock_service"
echo "   - Build: pip install -r requirements.txt"
echo "   - Start: uvicorn main:app --host 0.0.0.0 --port \$PORT"
echo "   - Environment Variables:"
echo "     * PORT: 10000"
echo "   - Click 'Create'"
echo "   - Copy service URL"
echo ""
echo "4. Click 'New +' → 'Web Service' (Node)"
echo "   - Connect GitHub repo: $REPO_NAME"
echo "   - Name: stock-rating-web"
echo "   - Build: npm install && npx prisma generate && npx prisma migrate deploy && npm run build"
echo "   - Start: npm start"
echo "   - Environment Variables:"
echo "     * DATABASE_URL: (paste Internal Database URL)"
echo "     * NODE_ENV: production"
echo "     * NEXT_PUBLIC_VNSTOCK_SERVICE_URL: (paste Python service URL)"
echo "   - Click 'Create'"
echo ""
echo "5. Sau khi deploy xong, vào Shell của stock-rating-web:"
echo "   npm run import:vnstock"
echo ""
echo "📖 Xem DEPLOY.md hoặc README_DEPLOY.md để biết chi tiết"
echo ""

