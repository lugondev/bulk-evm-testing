import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
	try {
		const networks = await prisma.network.findMany({
			include: {
				rpcUrls: {
					where: {
						isActive: true
					}
				}
			},
			orderBy: {
				name: 'asc'
			}
		})
		return NextResponse.json(networks)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch networks' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { name, chainId, symbol, isTestnet, rpcUrls } = body

		const network = await prisma.network.create({
			data: {
				name,
				chainId,
				symbol,
				isTestnet,
				rpcUrls: {
					createMany: {
						data: rpcUrls.filter((url: string) => url.trim()).map((url: string) => ({
							url,
							isActive: true
						}))
					}
				}
			},
			include: {
				rpcUrls: true
			}
		})

		return NextResponse.json(network)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to create network' }, { status: 500 })
	}
}
