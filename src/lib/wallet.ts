import { BigNumber, ethers } from 'ethers'
import { toast } from 'sonner'

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
	provider?: ethers.providers.JsonRpcProvider
	wallet: ethers.Wallet
	recipients: { address: string; amount: string | BigNumber }[]
}

interface BulkERC20TransferParams extends BulkTransferParams {
	tokenAddress: string
}

export async function bulkNativeTransfer({
	wallet,
	recipients,
}: BulkTransferParams) {
	const transferPromises = recipients.map(async (recipient) => {
		try {
			const tx = await wallet.sendTransaction({
				to: recipient.address,
				value: typeof recipient.amount === 'string'
					? ethers.utils.parseEther(recipient.amount)
					: recipient.amount,
			})

			await tx.wait()
			const msg = `Transfer to ${recipient.address} successful`
			toast.success(msg)
			return { success: true, hash: tx.hash, message: msg }
		} catch (error) {
			console.error('Transfer failed:', error)
			toast.error(`Transfer to ${recipient.address} failed`)
			return { success: false, error: (error as Error).message }
		}
	})

	return Promise.all(transferPromises)
}

export async function bulkERC20Transfer({
	wallet,
	recipients,
	tokenAddress,
}: BulkERC20TransferParams) {
	const contract = new ethers.Contract(tokenAddress, ERC20_ABI, wallet)
	const decimals = await contract.decimals()

	const transferPromises = recipients.map(async (recipient) => {
		try {
			const tx = await contract.transfer(
				recipient.address,
				typeof recipient.amount === 'string'
					? ethers.utils.parseUnits(recipient.amount, decimals)
					: recipient.amount,
			)

			await tx.wait()
			const msg = `Transfer to ${recipient.address} successful`
			toast.success(msg)
			return { success: true, hash: tx.hash, message: msg }
		} catch (error) {
			console.error('Token transfer failed:', error)
			toast.error(`Token transfer to ${recipient.address} failed`)
			return { success: false, error: (error as Error).message }
		}
	})

	return Promise.all(transferPromises)
}

export async function deployContract(
	wallet: ethers.Wallet,
	bytecode: string,
	abi: any[],
	args: any[],
) {
	try {
		const factory = new ethers.ContractFactory(abi, bytecode, wallet)
		const contract = await factory.deploy(...args)

		const receipt = await contract.deployTransaction.wait()
		const msg = `Contract deployed at ${contract.address}`
		toast.success(msg)
		return { success: true, address: contract.address, hash: receipt.transactionHash, message: msg }
	} catch (error) {
		console.error('Contract deployment failed:', error)
		toast.error('Contract deployment failed')
		return { success: false, error: (error as Error).message }
	}
}

export async function spamNetwork(
	wallet: ethers.Wallet,
	count: number,
) {
	const minValue = ethers.utils.parseEther('0.0001')
	const transfers = Array(count).fill(null).map(async () => {
		try {
			const randomWallet = ethers.Wallet.createRandom()

			const tx = await wallet.sendTransaction({
				to: randomWallet.address,
				value: minValue,
			})

			await tx.wait()
			const msg = `Spam transaction to ${randomWallet.address} successful`
			toast.success(msg)
			return { success: true, hash: tx.hash, message: msg }
		} catch (error) {
			console.error('Spam transaction failed:', error)
			return { success: false, error: (error as Error).message }
		}
	})

	return Promise.all(transfers)
}
