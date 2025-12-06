# VNStock Service

FastAPI service wrapper cho thư viện vnstock để lấy dữ liệu cổ phiếu Việt Nam.

## Cài đặt

```bash
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

## Chạy service

```bash
uvicorn main:app --reload --port 8000
```

Service sẽ chạy tại: http://localhost:8000

API docs (Swagger): http://localhost:8000/docs

## Endpoints

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
  },
  ...
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

## Lưu ý

- Service này chỉ dùng cho mục đích thử nghiệm/học tập
- Trong production, nên thêm authentication và rate limiting
- CORS hiện tại cho phép tất cả origins (dev only)


