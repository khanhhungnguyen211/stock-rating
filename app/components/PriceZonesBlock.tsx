// app/components/PriceZonesBlock.tsx

'use client'

import { PriceZones } from '@/lib/evaluatePriceZones'

interface PriceZonesBlockProps {
  priceZones: PriceZones
}

export default function PriceZonesBlock({ priceZones }: PriceZonesBlockProps) {
  const { shortTerm, longTerm } = priceZones

  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-6 hover:shadow-md transition-shadow duration-300">
      <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-6 tracking-tight">
        Phân tích Vùng Giá
      </h2>

      {/* Short-term Block */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Góc nhìn ngắn hạn</h3>
        <p className="text-sm text-gray-600 mb-4">{shortTerm.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Support Zone */}
          {shortTerm.supportZone[0] > 0 && shortTerm.supportZone[1] > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng hỗ trợ</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {shortTerm.supportZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {shortTerm.supportZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mức giá thấp nhất trong 20-30 phiên gần đây. Khi giá chạm vùng này, thường có lực mua vào.
              </p>
            </div>
          )}

          {/* Entry Zone */}
          {shortTerm.entryZone[0] > 0 && shortTerm.entryZone[1] > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng vào lệnh</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {shortTerm.entryZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {shortTerm.entryZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vùng giá tương đối an toàn để cân nhắc mua vào, nằm giữa vùng hỗ trợ và MA20.
              </p>
            </div>
          )}

          {/* Resistance Zone */}
          {shortTerm.resistZone[0] > 0 && shortTerm.resistZone[1] > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng kháng cự</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {shortTerm.resistZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {shortTerm.resistZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Mức giá cao nhất trong 20-30 phiên gần đây. Khi giá chạm vùng này, thường gặp lực bán ra.
              </p>
            </div>
          )}

          {/* TP Zone */}
          {shortTerm.tpZone[0] > 0 && shortTerm.tpZone[1] > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng chốt lời</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {shortTerm.tpZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {shortTerm.tpZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vùng giá phù hợp để chốt lời một phần, không nên tham lam giữ quá lâu.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Long-term Block */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Góc nhìn dài hạn</h3>
        <p className="text-sm text-gray-600 mb-4">{longTerm.summary}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Support Zone (MA200) */}
          {longTerm.supportZone[0] > 0 && longTerm.supportZone[1] > 0 && (
            <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng tích lũy quanh MA200</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {longTerm.supportZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {longTerm.supportZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vùng giá quanh đường MA200 (trung bình 200 phiên), nhiều nhà đầu tư dài hạn dùng để tích lũy.
              </p>
            </div>
          )}

          {/* TP Zone (52-week high) */}
          {longTerm.tpZone[0] > 0 && longTerm.tpZone[1] > 0 && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Vùng chốt lời dài hạn</h4>
              <div className="text-xs text-gray-600 mb-2">Khoảng giá</div>
              <div className="text-sm font-semibold text-gray-900 mb-3">
                {longTerm.tpZone[0].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} -{' '}
                {longTerm.tpZone[1].toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} VND
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Vùng giá gần đỉnh 52 tuần, phù hợp để chốt lời dài hạn khi giá đạt mức này.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
