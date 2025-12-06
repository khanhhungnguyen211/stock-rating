"""
VNStock Service - FastAPI wrapper cho vnstock library

Hướng dẫn chạy:
1. Từ thư mục vnstock_service:
   python -m venv venv
   source venv/bin/activate   # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn main:app --reload --port 8000

2. Service sẽ chạy tại http://localhost:8000
3. API docs tại http://localhost:8000/docs
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from vnstock import Vnstock
import pandas as pd

app = FastAPI(title="VNStock Service", version="1.0.0")

# CORS - cấu hình cho cả dev và production
import os
cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
if cors_origins == ["*"]:
    # Development mode - allow all
    allowed_origins = ["*"]
else:
    # Production mode - chỉ cho phép specific origins
    allowed_origins = [origin.strip() for origin in cors_origins]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {
        "message": "VNStock Service is running",
        "endpoints": {
            "price_history": "/api/stock/{symbol}/price-history",
            "fundamentals": "/api/stock/{symbol}/fundamentals",
            "index_quote": "/api/index/{index_symbol}/quote",
        },
    }


@app.get("/api/stock/{symbol}/price-history")
async def get_price_history(
    symbol: str,
    start: str = "2024-01-01",
    end: Optional[str] = None,
):
    """
    Lấy lịch sử giá cổ phiếu từ vnstock

    Args:
        symbol: Mã cổ phiếu (ví dụ: "FPT", "VCB")
        start: Ngày bắt đầu (YYYY-MM-DD), default "2024-01-01"
        end: Ngày kết thúc (YYYY-MM-DD), default = hôm nay

    Returns:
        JSON array với các record: date, open, close, high, low, volume
    """
    try:
        if end is None:
            end = datetime.now().strftime("%Y-%m-%d")

        # Khởi tạo Vnstock và lấy dữ liệu
        stock = Vnstock().stock(symbol=symbol.upper(), source="VCI")
        df = stock.quote.history(start=start, end=end, interval="1D")

        if df is None or df.empty:
            raise HTTPException(
                status_code=404, detail=f"Không tìm thấy dữ liệu giá cho {symbol}"
            )

        # Chuẩn hóa tên cột và format
        df = df.reset_index()
        
        # Đảm bảo có cột date
        if "time" in df.columns:
            df["date"] = pd.to_datetime(df["time"]).dt.strftime("%Y-%m-%d")
        elif "date" not in df.columns:
            df["date"] = df.index

        # Chọn các cột cần thiết và đổi tên về lowercase
        columns_map = {
            "open": "open",
            "close": "close",
            "high": "high",
            "low": "low",
            "volume": "volume",
        }

        result_df = pd.DataFrame()
        for col in ["date"]:
            if col in df.columns:
                result_df[col] = df[col]

        for vnstock_col, output_col in columns_map.items():
            # Tìm cột tương ứng (case-insensitive)
            matching_cols = [
                c for c in df.columns if c.lower() == vnstock_col.lower()
            ]
            if matching_cols:
                result_df[output_col] = df[matching_cols[0]]
            else:
                result_df[output_col] = None

        # Convert sang dict records
        records = result_df.to_dict(orient="records")

        # Đảm bảo các giá trị số là float/int, không phải numpy types
        for record in records:
            for key, value in record.items():
                if pd.isna(value):
                    record[key] = None
                elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                    record[key] = str(value)
                elif hasattr(value, "item"):  # numpy scalar
                    record[key] = value.item()

        return records

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi khi lấy dữ liệu giá cho {symbol}: {str(e)}",
        )


@app.get("/api/stock/{symbol}/fundamentals")
async def get_fundamentals(symbol: str):
    """
    Lấy thông tin cơ bản và chỉ số tài chính từ vnstock

    Args:
        symbol: Mã cổ phiếu (ví dụ: "FPT", "VCB")

    Returns:
        JSON object với:
        - overview: Thông tin tổng quan công ty
        - ratios: Chỉ số tài chính theo năm
    """
    try:
        stock = Vnstock().stock(symbol=symbol.upper(), source="VCI")

        overview_records = []
        ratio_records = []

        # Lấy overview - xử lý lỗi riêng
        try:
            overview_df = stock.company.overview()
            if overview_df is not None and not overview_df.empty:
                overview_df = overview_df.reset_index()
                overview_records = overview_df.to_dict(orient="records")
                # Clean numpy types
                for record in overview_records:
                    for key, value in record.items():
                        if pd.isna(value):
                            record[key] = None
                        elif hasattr(value, "item"):
                            record[key] = value.item()
                        elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                            record[key] = str(value)
        except Exception as e:
            print(f"Warning: Không lấy được overview cho {symbol}: {str(e)}")
            # Tiếp tục với ratios

        # Lấy ratios - xử lý lỗi riêng
        try:
            # Thử với các tham số khác nhau nếu cần
            ratio_df = stock.finance.ratio(period="year", lang="vi", dropna=True)
            if ratio_df is not None and not ratio_df.empty:
                # Xử lý MultiIndex columns nếu có
                if isinstance(ratio_df.columns, pd.MultiIndex):
                    # Flatten MultiIndex columns: ('Level1', 'Level2') -> 'Level1_Level2'
                    ratio_df.columns = [
                        f"{col[0]}_{col[1]}" if col[1] and str(col[1]) != "nan" else str(col[0])
                        for col in ratio_df.columns.values
                    ]
                
                ratio_df = ratio_df.reset_index()
                ratio_records = ratio_df.to_dict(orient="records")
                # Clean numpy types
                for record in ratio_records:
                    for key, value in record.items():
                        if pd.isna(value):
                            record[key] = None
                        elif hasattr(value, "item"):
                            record[key] = value.item()
                        elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                            record[key] = str(value)
        except Exception as e:
            error_msg = str(e)
            print(f"Warning: Không lấy được ratios cho {symbol}: {error_msg}")
            import traceback
            print(f"Traceback: {traceback.format_exc()}")
            # Thử với tham số khác nếu lỗi
            try:
                ratio_df = stock.finance.ratio(period="year", dropna=True)
                if ratio_df is not None and not ratio_df.empty:
                    # Xử lý MultiIndex columns nếu có
                    if isinstance(ratio_df.columns, pd.MultiIndex):
                        ratio_df.columns = [
                            f"{col[0]}_{col[1]}" if col[1] and str(col[1]) != "nan" else str(col[0])
                            for col in ratio_df.columns.values
                        ]
                    
                    ratio_df = ratio_df.reset_index()
                    ratio_records = ratio_df.to_dict(orient="records")
                    for record in ratio_records:
                        for key, value in record.items():
                            if pd.isna(value):
                                record[key] = None
                            elif hasattr(value, "item"):
                                record[key] = value.item()
                            elif isinstance(value, (pd.Timestamp, pd.DatetimeTZDtype)):
                                record[key] = str(value)
                    print(f"Success: Lấy được ratios cho {symbol} với tham số khác")
            except Exception as e2:
                print(f"Warning: Vẫn không lấy được ratios cho {symbol} sau khi thử lại: {str(e2)}")
                import traceback
                print(f"Traceback: {traceback.format_exc()}")
            # Vẫn trả về kết quả với overview nếu có

        # Nếu cả overview và ratios đều rỗng, trả về lỗi
        if not overview_records and not ratio_records:
            raise HTTPException(
                status_code=404,
                detail=f"Không tìm thấy dữ liệu fundamental cho {symbol}",
            )

        return {
            "overview": overview_records,
            "ratios": ratio_records,
        }

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Lỗi khi lấy dữ liệu tài chính cho {symbol}: {str(e)}"
        print(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)


@app.get("/api/index/{index_symbol}/quote")
async def get_index_quote(index_symbol: str):
    """
    Lấy thông tin chỉ số thị trường (VN-Index, VN30, HNX, UPCOM)
    
    Args:
        index_symbol: Mã chỉ số (VNINDEX, VN30, HNXINDEX, UPCOMINDEX)
    
    Returns:
        JSON với: symbol, current_value, change, change_percent, volume, updated_at
    """
    try:
        # Map symbol names
        # VN30 dùng "VN30" trực tiếp (đã test và xác nhận hoạt động)
        index_map = {
            "VNINDEX": "VNINDEX",
            "VN30": "VN30",  # Symbol đúng là VN30
            "VN30INDEX": "VN30",  # Map VN30INDEX về VN30
            "HNX": "HNXINDEX",
            "HNXINDEX": "HNXINDEX",
            "UPCOM": "UPCOMINDEX",
            "UPCOMINDEX": "UPCOMINDEX"
        }
        
        mapped_symbol = index_map.get(index_symbol.upper(), index_symbol.upper())
        
        # Lấy dữ liệu từ vnstock
        stock = Vnstock().stock(symbol=mapped_symbol, source="VCI")
        
        # Lấy lịch sử 5 ngày để có dữ liệu đáng tin cậy
        end = datetime.now().strftime("%Y-%m-%d")
        start = (datetime.now() - timedelta(days=5)).strftime("%Y-%m-%d")
        
        try:
            history = stock.quote.history(start=start, end=end, interval="1D")
        except Exception as e:
            print(f"Error fetching history for {mapped_symbol}: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail=f"Lỗi khi lấy lịch sử cho {index_symbol}: {str(e)}"
            )
        
        if history is None or history.empty:
            raise HTTPException(
                status_code=404, 
                detail=f"Không tìm thấy dữ liệu lịch sử cho chỉ số {index_symbol} (symbol: {mapped_symbol})"
            )
        
        # Tìm cột chứa giá trị index (close, price, hoặc cột số đầu tiên)
        close_col = None
        for col in history.columns:
            col_lower = col.lower()
            if col_lower in ['close', 'price', 'index'] or 'index' in col_lower:
                close_col = col
                break
        
        if not close_col:
            # Thử lấy cột số đầu tiên
            numeric_cols = history.select_dtypes(include=['number']).columns
            if len(numeric_cols) > 0:
                close_col = numeric_cols[0]
            else:
                raise HTTPException(
                    status_code=500, 
                    detail=f"Không tìm thấy cột giá trị trong dữ liệu cho {index_symbol}"
                )
        
        # Lấy giá trị hiện tại (ngày mới nhất)
        latest = history.iloc[-1]
        current_value = float(latest[close_col])
        
        # Tính change so với ngày trước
        change = 0
        change_percent = 0
        if len(history) >= 2:
            prev_value = float(history.iloc[-2][close_col])
            change = current_value - prev_value
            change_percent = ((change / prev_value) * 100) if prev_value > 0 else 0
        
        result = {
            "symbol": mapped_symbol,
            "current_value": current_value,
            "change": change,
            "change_percent": change_percent,
            "volume": 0,
            "updated_at": datetime.now().isoformat()
        }
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_detail = f"Lỗi khi lấy dữ liệu chỉ số {index_symbol}: {str(e)}"
        print(f"Error traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=error_detail)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)


