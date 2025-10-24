import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleId, amount, method, notes } = body

    if (!saleId || !amount) {
      return NextResponse.json({ error: 'Sale ID and amount are required' }, { status: 400 })
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        saleId,
        amount,
        method,
        notes
      }
    })

    // Update sale with new payment info
    const sale = await db.sale.findUnique({
      where: { id: saleId }
    })

    if (sale) {
      const newPaidAmount = sale.paidAmount + amount
      const newDueAmount = sale.dueAmount - amount
      const newStatus = newDueAmount <= 0 ? 'paid' : 'partial'

      await db.sale.update({
        where: { id: saleId },
        data: {
          paidAmount: newPaidAmount,
          dueAmount: Math.max(0, newDueAmount),
          status: newStatus
        }
      })
    }

    return NextResponse.json(payment, { status: 201 })
  } catch (error) {
    console.error('Payment creation error:', error)
    return NextResponse.json({ error: 'Failed to record payment' }, { status: 500 })
  }
}