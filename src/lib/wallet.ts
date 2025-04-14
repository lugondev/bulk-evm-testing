import { ethers } from 'ethers'
import type { PrismaClient } from '@prisma/client'
import { toast } from 'sonner'
import { encryptPrivateKey, decryptPrivateKey } from './crypto'

export async function createWallet() {
	const wallet = ethers.Wallet.createRandom()
	return {
		address: wallet.address,
		privateKey: wallet.privateKey
	}
}

export async function getWalletInstance(data: {
	privateKey: string
}) {
	return new ethers.Wallet(data.privateKey)
}

const ERC20_ABI = [
	'function transfer(address to, uint256 amount) returns (bool)',
	'function balanceOf(address owner) view returns (uint256)',
	'function decimals() view returns (uint8)',
]

interface BulkTransferParams {
	provider: ethers.providers.JsonRpcProvider
	wallet: ethers.Wallet
	recipients: { address: string; amount: string }[]
	prisma: PrismaClient
}

interface BulkERC20TransferParams extends BulkTransferParams {
	tokenAddress: string
}

export async function bulkNativeTransfer({
	provider,
	wallet,
	recipients,
	prisma,
}: BulkTransferParams) {
	const results = []

	for (const recipient of recipients) {
		try {
			const tx = await wallet.sendTransaction({
				to: recipient.address,
				value: ethers.utils.parseEther(recipient.amount),
			})

			await prisma.transaction.create({
				data: {
					hash: tx.hash,
					from: wallet.address,
					to: recipient.address,
					value: recipient.amount,
					type: 'NATIVE_TRANSFER',
					status: 'PENDING',
				},
			})

			const receipt = await tx.wait()

			await prisma.transaction.update({
				where: { hash: tx.hash },
				data: {
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					gasUsed: receipt.gasUsed.toString(),
				},
			})

			results.push({ success: true, hash: tx.hash })
			toast.success(`Transfer to ${recipient.address} successful`)
		} catch (error) {
			console.error('Transfer failed:', error)
			results.push({ success: false, error: (error as Error).message })
			toast.error(`Transfer to ${recipient.address} failed`)
		}
	}

	return results
}

export async function bulkERC20Transfer({
	provider,
	wallet,
	recipients,
	tokenAddress,
	prisma,
}: BulkERC20TransferParams) {
	const results = []
	const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)
	const decimals = await contract.decimals()

	for (const recipient of recipients) {
		try {
			const tx = await contract.transfer(
				recipient.address,
				ethers.utils.parseUnits(recipient.amount, decimals)
			)

			await prisma.transaction.create({
				data: {
					hash: tx.hash,
					from: wallet.address,
					to: recipient.address,
					value: recipient.amount,
					type: 'ERC20_TRANSFER',
					tokenAddress,
					status: 'PENDING',
				},
			})

			const receipt = await tx.wait()

			await prisma.transaction.update({
				where: { hash: tx.hash },
				data: {
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					gasUsed: receipt.gasUsed.toString(),
				},
			})

			results.push({ success: true, hash: tx.hash })
			toast.success(`Token transfer to ${recipient.address} successful`)
		} catch (error) {
			console.error('Token transfer failed:', error)
			results.push({ success: false, error: (error as Error).message })
			toast.error(`Token transfer to ${recipient.address} failed`)
		}
	}

	return results
}

export async function deployContract(
	provider: ethers.providers.JsonRpcProvider,
	wallet: ethers.Wallet,
	bytecode: string,
	abi: any[],
	args: any[],
	prisma: PrismaClient
) {
	try {
		const factory = new ethers.ContractFactory(abi, bytecode, wallet)
		const contract = await factory.deploy(...args)

		await prisma.transaction.create({
			data: {
				hash: contract.deployTransaction.hash,
				from: wallet.address,
				to: '',
				value: '0',
				type: 'CONTRACT_DEPLOYMENT',
				status: 'PENDING',
			},
		})

		const receipt = await contract.deployTransaction.wait()

		await prisma.transaction.update({
			where: { hash: contract.deployTransaction.hash },
			data: {
				status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
				gasUsed: receipt.gasUsed.toString(),
				to: contract.address,
			},
		})

		toast.success('Contract deployed successfully')
		return { success: true, address: contract.address, hash: receipt.transactionHash }
	} catch (error) {
		console.error('Contract deployment failed:', error)
		toast.error('Contract deployment failed')
		return { success: false, error: (error as Error).message }
	}
}

export async function spamNetwork(
	provider: ethers.providers.JsonRpcProvider,
	wallet: ethers.Wallet,
	count: number,
	prisma: PrismaClient
) {
	const results = []
	const minValue = ethers.utils.parseEther('0.0001')

	for (let i = 0; i < count; i++) {
		try {
			// Generate a random wallet as recipient
			const randomWallet = ethers.Wallet.createRandom()

			const tx = await wallet.sendTransaction({
				to: randomWallet.address,
				value: minValue,
			})

			await prisma.transaction.create({
				data: {
					hash: tx.hash,
					from: wallet.address,
					to: randomWallet.address,
					value: minValue.toString(),
					type: 'NATIVE_TRANSFER',
					status: 'PENDING',
				},
			})

			const receipt = await tx.wait()

			await prisma.transaction.update({
				where: { hash: tx.hash },
				data: {
					status: receipt.status === 1 ? 'SUCCESS' : 'FAILED',
					gasUsed: receipt.gasUsed.toString(),
				},
			})

			results.push({ success: true, hash: tx.hash })
		} catch (error) {
			console.error('Spam transaction failed:', error)
			results.push({ success: false, error: (error as Error).message })
		}
	}

	return results
}
