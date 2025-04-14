import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { url } = body

		const rpcUrl = await prisma.rpcUrl.create({
			data: {
				url,
				isActive: true,
				networkId: params.id
			}
		})

		return NextResponse.json(rpcUrl)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to add RPC URL' }, { status: 500 })
	}
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const body = await request.json()
		const { rpcId, isActive } = body

		const rpcUrl = await prisma.rpcUrl.update({
			where: {
				id: rpcId,
				networkId: params.id
			},
			data: {
				isActive
			}
		})

		return NextResponse.json(rpcUrl)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to update RPC URL status' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const { rpcId } = await request.json()

		await prisma.rpcUrl.delete({
			where: {
				id: rpcId,
				networkId: params.id
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		return NextResponse.json({ error: 'Failed to delete RPC URL' }, { status: 500 })
	}
}
