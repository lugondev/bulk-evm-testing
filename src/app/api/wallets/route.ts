import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Wallet, Transaction } from '@/types/database'
import { createWallet } from '@/lib/wallet'
import { encryptPrivateKey } from '@/lib/crypto'

export async function GET() {
	try {
		const wallets = await prisma.wallet.findMany({
			include: {
				transactions: true
			},
			orderBy: {
				createdAt: 'desc'
			}
		})
		return NextResponse.json(wallets)
	} catch (error) {
		return NextResponse.json({ error: 'Failed to fetch wallets' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { privateKey, name } = body

		try {
			let walletData: Awaited<ReturnType<typeof createWallet>>

			if (privateKey) {
				// Import existing wallet
				const wallet = new ethers.Wallet(privateKey)
				const encryptedData = await encryptPrivateKey(wallet.privateKey)
				walletData = {
					address: wallet.address,
					...encryptedData
				}
			} else {
				// Create new wallet
				walletData = await createWallet()
			}

			// Store in database with encrypted private key
			const dbWallet = await prisma.wallet.create({
				data: {
					...walletData,
					name: name || null,
				}
			})

			// Return wallet data without sensitive info
			const response = {
				id: dbWallet.id,
				address: dbWallet.address,
				name: dbWallet.name,
				createdAt: dbWallet.createdAt,
				updatedAt: dbWallet.updatedAt,
				transactions: []
			}

			return NextResponse.json(response)
		} catch (error) {
			console.error('Operation failed:', error)
			return NextResponse.json({ error: 'Failed to process wallet operation' }, { status: 500 })
		}
	} catch (error) {
		console.error('Request parsing error:', error)
		return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
	}
}
