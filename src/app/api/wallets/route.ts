import { NextRequest, NextResponse } from 'next/server'
import { ethers } from 'ethers'
import prisma from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { Wallet, Transaction } from '@/types/database'
import { createWallet } from '@/lib/wallet'

const BULK_LIMIT = 100 // Maximum number of wallets per bulk request

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

		// Check if this is a bulk creation request
		if ('quantity' in body) {
			const quantity = parseInt(body.quantity)
			if (isNaN(quantity) || quantity < 1) {
				return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
			}
			if (quantity > BULK_LIMIT) {
				return NextResponse.json({ error: `Cannot create more than ${BULK_LIMIT} wallets at once` }, { status: 400 })
			}

			// Create multiple wallets
			const wallets = []
			for (let i = 0; i < quantity; i++) {
				const walletData = await createWallet()
				const dbWallet = await prisma.wallet.create({
					data: walletData
				})

				wallets.push({
					id: dbWallet.id,
					address: dbWallet.address,
					createdAt: dbWallet.createdAt,
					updatedAt: dbWallet.updatedAt,
					transactions: []
				})
			}

			return NextResponse.json(wallets)
		}

		// Single wallet creation
		const { privateKey } = body
		let walletData: Awaited<ReturnType<typeof createWallet>>

		if (privateKey) {
			// Import existing wallet
			const wallet = new ethers.Wallet(privateKey)
			walletData = {
				address: wallet.address,
				privateKey: wallet.privateKey
			}
		} else {
			// Create new wallet
			walletData = await createWallet()
		}

		// Store in database with encrypted private key
		const dbWallet = await prisma.wallet.create({
			data: walletData
		})

		// Return wallet data without sensitive info
		const response = {
			id: dbWallet.id,
			address: dbWallet.address,
			createdAt: dbWallet.createdAt,
			updatedAt: dbWallet.updatedAt,
			transactions: []
		}

		return NextResponse.json(response)

	} catch (error) {
		console.error('Operation failed:', error)
		return NextResponse.json({ error: 'Failed to process wallet operation' }, { status: 500 })
	}
}
