import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sale = await db.sale.findUnique({
      where: { id: params.id },
      include: {
        customer: true,
        payments: true
      }
    })

    if (!sale) {
      return NextResponse.json({ error: 'Sale not found' }, { status: 404 })
    }

    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sale' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { status, notes } = body

    const sale = await db.sale.update({
      where: { id: params.id },
      data: {
        status,
        notes
      },
      include: {
        customer: true,
        payments: true
      }
    })

    return NextResponse.json(sale)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update sale' }, { status: 500 })
  }
}