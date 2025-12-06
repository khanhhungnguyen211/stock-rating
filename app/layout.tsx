import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Stock Valuation App',
  description: 'Ứng dụng định giá và phân tích cổ phiếu',
}

import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi">
      <body className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 min-h-screen">
        <header className="bg-white/80 backdrop-blur-sm shadow-md border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg group-hover:shadow-xl transition">
                  <span className="text-white font-bold text-lg">S</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Stock Valuation</h1>
                  <p className="text-xs text-gray-500">Phân tích & Định giá</p>
                </div>
              </Link>
            </div>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <p className="text-center text-sm text-gray-600">
              © 2024 Stock Valuation App - Dữ liệu chỉ mang tính chất tham khảo
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}


