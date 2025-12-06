# Troubleshooting Guide

## Lỗi "Cannot find module './936.js'" hoặc các lỗi module tương tự

### Nguyên nhân
Lỗi này thường xảy ra do cache của Next.js bị lỗi hoặc không đồng bộ sau khi có thay đổi code.

### Giải pháp nhanh

1. **Dừng dev server** (Ctrl+C trong terminal đang chạy `npm run dev`)

2. **Xóa cache và rebuild:**
   ```bash
   npm run clean
   npm run dev
   ```

   Hoặc dùng script tự động:
   ```bash
   npm run dev:clean
   ```

3. **Nếu vẫn lỗi, thử:**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   npm run dev
   ```

### Scripts đã được thêm vào package.json

- `npm run clean` - Xóa cache (.next và node_modules/.cache)
- `npm run dev:clean` - Xóa cache và chạy dev server
- `npm run build:clean` - Xóa cache và build production

### Cải thiện đã áp dụng

1. **next.config.js** đã được cải thiện với:
   - `onDemandEntries` để quản lý cache tốt hơn
   - `webpack.watchOptions` để cải thiện file watching

2. **Code cleanup**: Đã xóa code không dùng trong `lib/stockInsights.ts`

### Khi nào cần chạy cleanup?

- Sau khi thay đổi cấu trúc file/folder
- Sau khi cập nhật dependencies
- Khi gặp lỗi module không tìm thấy
- Khi dữ liệu hiển thị không đúng (có thể do cache)

### Best Practices

1. **Luôn dùng `npm run dev:clean`** khi bắt đầu làm việc mới
2. **Kiểm tra lỗi build** trước khi chạy dev: `npm run build`
3. **Commit thường xuyên** để có thể rollback nếu cần

