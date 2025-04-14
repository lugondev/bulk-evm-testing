import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id
		await prisma.network.delete({
			where: { id }
		})
		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to delete network' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const body = await request.json()
		const { name, chainId, symbol, isTestnet } = body

		const id = (await params).id
		const network = await prisma.network.update({
			where: { id },
			data: {
				name,
				chainId,
				symbol,
				isTestnet
			},
			include: {
				rpcUrls: true
			}
		})

		return NextResponse.json(network)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update network' }, { status: 500 })
	}
}
