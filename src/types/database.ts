import type { Prisma } from '@prisma/client'

export type RpcUrl = {
	id: string
	url: string
	isActive: boolean
	networkId: string
	createdAt: Date
	updatedAt: Date
	network: Network
}

export type Network = {
	id: string
	name: string
	chainId: number
	symbol: string
	isTestnet: boolean
	createdAt: Date
	updatedAt: Date
	rpcUrls: RpcUrl[]
}

export type Wallet = {
	id: string
	address: string
	name?: string | null
	privateKey: string
	iv: string
	authTag: string
	salt: string
	createdAt: Date
	updatedAt: Date
	transactions: Transaction[]
}

export type Transaction = {
	id: string
	hash: string
	from: string
	to: string
	value: string
	gasUsed?: string | null
	status: 'PENDING' | 'SUCCESS' | 'FAILED'
	type: 'NATIVE_TRANSFER' | 'ERC20_TRANSFER' | 'CONTRACT_DEPLOYMENT' | 'CONTRACT_INTERACTION'
	tokenAddress?: string | null
	createdAt: Date
	updatedAt: Date
	wallet: Wallet
}
