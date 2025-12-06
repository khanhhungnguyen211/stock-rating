'use server'

import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { Stock } from '@prisma/client'

export async function createStock(formData: FormData) {
  try {
    const symbol = formData.get('symbol')?.toString().toUpperCase() || ''
    const name = formData.get('name')?.toString() || ''
    const sector = formData.get('sector')?.toString() || ''
    const price = parseFloat(formData.get('price')?.toString() || '0')
    const eps = parseFloat(formData.get('eps')?.toString() || '0')
    const pe = parseFloat(formData.get('pe')?.toString() || '0')
    const roe = parseFloat(formData.get('roe')?.toString() || '0')
    const growthRate = parseFloat(formData.get('growth_rate')?.toString() || '0')

    await prisma.stock.create({
      data: {
        symbol,
        name,
        sector,
        price,
        eps,
        pe,
        roe,
        growth_rate: growthRate,
      },
    })

    revalidatePath('/admin/stocks')
    revalidatePath('/')
    return { success: true, message: 'Thêm cổ phiếu thành công!' }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi thêm cổ phiếu',
    }
  }
}

export async function updateStock(formData: FormData) {
  try {
    const id = parseInt(formData.get('id')?.toString() || '0')
    const symbol = formData.get('symbol')?.toString().toUpperCase() || ''
    const name = formData.get('name')?.toString() || ''
    const sector = formData.get('sector')?.toString() || ''
    const price = parseFloat(formData.get('price')?.toString() || '0')
    const eps = parseFloat(formData.get('eps')?.toString() || '0')
    const pe = parseFloat(formData.get('pe')?.toString() || '0')
    const roe = parseFloat(formData.get('roe')?.toString() || '0')
    const growthRate = parseFloat(formData.get('growth_rate')?.toString() || '0')

    await prisma.stock.update({
      where: { id },
      data: {
        symbol,
        name,
        sector,
        price,
        eps,
        pe,
        roe,
        growth_rate: growthRate,
      },
    })

    revalidatePath('/admin/stocks')
    revalidatePath('/')
    revalidatePath(`/stocks/${symbol}`)
    return { success: true, message: 'Cập nhật cổ phiếu thành công!' }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi cập nhật cổ phiếu',
    }
  }
}

export async function deleteStock(id: number) {
  try {
    await prisma.stock.delete({
      where: { id },
    })

    revalidatePath('/admin/stocks')
    revalidatePath('/')
    return { success: true, message: 'Xóa cổ phiếu thành công!' }
  } catch (error: any) {
    return {
      success: false,
      message: error.message || 'Có lỗi xảy ra khi xóa cổ phiếu',
    }
  }
}


