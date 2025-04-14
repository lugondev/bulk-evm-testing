import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		await prisma.wallet.delete({
			where: { id: params.id }
		})
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to delete wallet' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { name } = body

		const wallet = await prisma.wallet.update({
			where: { id: params.id },
			data: { name },
			include: {
				transactions: true
			}
		})

		return NextResponse.json(wallet)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update wallet' }, { status: 500 })
	}
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const wallet = await prisma.wallet.findUnique({
			where: { id: params.id },
			include: {
				transactions: {
					orderBy: {
						createdAt: 'desc'
					}
				}
			}
		})

		if (!wallet) {
			return NextResponse.json({ error: 'Wallet not found' }, { status: 404 })
		}

		return NextResponse.json(wallet)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch wallet' }, { status: 500 })
	}
}
