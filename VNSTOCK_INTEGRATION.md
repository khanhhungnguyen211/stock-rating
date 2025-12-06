# Hướng dẫn tích hợp VNStock Service

Tài liệu này hướng dẫn cách chạy và sử dụng VNStock Service để lấy dữ liệu cổ phiếu thực tế từ vnstock library.

## Tổng quan

VNStock Service là một FastAPI service wrapper cho thư viện Python `vnstock`, cho phép web app Next.js lấy:
- Lịch sử giá cổ phiếu (price history)
- Thông tin cơ bản và chỉ số tài chính (fundamentals)

## Cấu trúc

```
stock-rating/
├── vnstock_service/          # Python FastAPI service
│   ├── main.py              # FastAPI app
│   ├── requirements.txt     # Python dependencies
│   └── README.md            # Hướng dẫn chi tiết
├── lib/
│   └── vnstockClient.ts     # TypeScript client để gọi service
└── app/stocks/[symbol]/
    └── page.tsx             # Trang chi tiết (đã tích hợp)
```

## Bước 1: Cài đặt và chạy VNStock Service

### 1.1. Cài đặt Python dependencies

```bash
cd vnstock_service

# Tạo virtual environment
python -m venv venv

# Kích hoạt virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Cài đặt dependencies
pip install -r requirements.txt
```

### 1.2. Chạy service

```bash
# Từ thư mục vnstock_service
uvicorn main:app --reload --port 8000
```

Service sẽ chạy tại: **http://localhost:8000**

API docs (Swagger UI): **http://localhost:8000/docs**

## Bước 2: Cấu hình Web App

### 2.1. Tạo file `.env.local` (nếu chưa có)

Tạo file `.env.local` ở root của project:

```env
NEXT_PUBLIC_VNSTOCK_SERVICE_URL=http://localhost:8000
```

### 2.2. Chạy web app

```bash
# Từ root của project
npm run dev
```

## Bước 3: Kiểm tra tích hợp

1. Mở trình duyệt: http://localhost:3000
2. Vào trang chi tiết một cổ phiếu (ví dụ: `/stocks/FPT`)
3. Scroll xuống phần **"Dữ liệu VNStock (Demo)"**
4. Nếu service đang chạy, bạn sẽ thấy:
   - Bảng lịch sử giá (5 phiên gần nhất)
   - Chỉ số tài chính (ROE, EPS, P/E)

## API Endpoints

### 1. GET `/api/stock/{symbol}/price-history`

Lấy lịch sử giá cổ phiếu.

**Query params:**
- `start` (optional): Ngày bắt đầu (YYYY-MM-DD), default: "2024-01-01"
- `end` (optional): Ngày kết thúc (YYYY-MM-DD), default: hôm nay

**Ví dụ:**
```
GET /api/stock/FPT/price-history?start=2024-01-01&end=2024-12-31
```

**Response:**
```json
[
  {
    "date": "2024-01-02",
    "open": 125000,
    "close": 126000,
    "high": 127000,
    "low": 124000,
    "volume": 1000000
  }
]
```

### 2. GET `/api/stock/{symbol}/fundamentals`

Lấy thông tin cơ bản và chỉ số tài chính.

**Ví dụ:**
```
GET /api/stock/FPT/fundamentals
```

**Response:**
```json
{
  "overview": [...],
  "ratios": [...]
}
```

## Error Handling

- Nếu VNStock service không chạy, web app sẽ:
  - Hiển thị cảnh báo màu vàng
  - Tự động fallback về mock data cho insights engine
  - Không crash ứng dụng

## Lưu ý

1. **Mục đích**: Tích hợp này chỉ dùng cho **thử nghiệm/học tập**
2. **Performance**: Service cache dữ liệu (60s cho price history, 1h cho fundamentals)
3. **CORS**: Hiện tại cho phép tất cả origins (dev only)
4. **Production**: Nên thêm authentication và rate limiting

## Troubleshooting

### Service không chạy được

- Kiểm tra Python version (>= 3.8)
- Kiểm tra đã cài đủ dependencies: `pip list`
- Xem logs trong terminal để biết lỗi cụ thể

### Web app không kết nối được service

- Kiểm tra service đang chạy tại port 8000
- Kiểm tra biến môi trường `NEXT_PUBLIC_VNSTOCK_SERVICE_URL`
- Kiểm tra CORS settings trong `main.py`

### Không có dữ liệu

- Kiểm tra mã cổ phiếu có đúng format (ví dụ: "FPT", "VCB")
- Kiểm tra vnstock library có thể truy cập được dữ liệu
- Xem console logs trong browser để debug

## Tích hợp vào Insight Engine

Hiện tại, dữ liệu từ VNStock được:
1. Hiển thị trong section demo
2. Tự động dùng cho `pricesHistory` và `volumesHistory` nếu có

Để tích hợp sâu hơn:
- Map dữ liệu từ `vnstockFundamentals.ratios` vào các field như `epsGrowth3Y`, `revenueGrowth3Y`, `debtToEquity`
- Sử dụng dữ liệu thực tế thay vì mock data


