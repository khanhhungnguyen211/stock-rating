'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Stock } from '@prisma/client'
import { createStock, updateStock, deleteStock } from './actions'

interface StockFormProps {
  stock?: Stock
}

export default function StockForm({ stock }: StockFormProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(!stock)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const isEditMode = !!stock

  const handleSubmit = async (formData: FormData) => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = isEditMode
        ? await updateStock(formData)
        : await createStock(formData)

      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        if (!isEditMode) {
          // Reset form for new stock
          const form = document.getElementById('stock-form') as HTMLFormElement
          form?.reset()
        }
        setIsOpen(false)
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!stock || !confirm('Bạn có chắc chắn muốn xóa cổ phiếu này?')) {
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await deleteStock(stock.id)
      if (result.success) {
        setMessage({ type: 'success', text: result.message })
        router.refresh()
      } else {
        setMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Có lỗi xảy ra khi xóa' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen && isEditMode) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Sửa
      </button>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${isEditMode ? 'mb-4' : ''}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-semibold text-gray-900">
          {isEditMode ? 'Chỉnh sửa cổ phiếu' : 'Thêm cổ phiếu mới'}
        </h3>
        {isEditMode && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        )}
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form id="stock-form" action={handleSubmit} className="space-y-4">
        {isEditMode && <input type="hidden" name="id" value={stock.id} />}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="symbol"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Symbol *
            </label>
            <input
              type="text"
              id="symbol"
              name="symbol"
              required
              defaultValue={stock?.symbol}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="VD: FPT"
            />
          </div>

          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tên công ty *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              defaultValue={stock?.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="sector"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Ngành *
            </label>
            <input
              type="text"
              id="sector"
              name="sector"
              required
              defaultValue={stock?.sector}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="price"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Giá (VND) *
            </label>
            <input
              type="number"
              id="price"
              name="price"
              required
              step="0.01"
              min="0"
              defaultValue={stock?.price}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="eps"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              EPS (VND) *
            </label>
            <input
              type="number"
              id="eps"
              name="eps"
              required
              step="0.01"
              min="0"
              defaultValue={stock?.eps}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="pe"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              P/E *
            </label>
            <input
              type="number"
              id="pe"
              name="pe"
              required
              step="0.01"
              min="0"
              defaultValue={stock?.pe}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="roe"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              ROE (%) *
            </label>
            <input
              type="number"
              id="roe"
              name="roe"
              required
              step="0.01"
              min="0"
              defaultValue={stock?.roe}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label
              htmlFor="growth_rate"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tăng trưởng (%/năm) *
            </label>
            <input
              type="number"
              id="growth_rate"
              name="growth_rate"
              required
              step="0.01"
              defaultValue={stock?.growth_rate}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? 'Đang xử lý...'
              : isEditMode
              ? 'Cập nhật'
              : 'Thêm mới'}
          </button>

          {isEditMode && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Xóa
            </button>
          )}

          {isEditMode && (
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
            >
              Hủy
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

