import { BigNumber, ethers } from 'ethers'
import { toast } from 'sonner'
import { flatten } from 'lodash'

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
	const nonce = await wallet.getTransactionCount()
	const transferPromises = recipients.map(async (recipient, index) => {
		try {
			const tx = await wallet.sendTransaction({
				to: recipient.address,
				value: typeof recipient.amount === 'string'
					? ethers.utils.parseEther(recipient.amount)
					: recipient.amount,
				nonce: nonce + index,
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

function generateRandomEthAddress(): string {
	// Create a random 20-byte (40 hex characters) address
	let addr: string = '0x';
	const characters: string = '0123456789abcdef';

	// Ethereum addresses are 20 bytes (40 hex characters) long
	for (let i: number = 0; i < 40; i++) {
		addr += characters.charAt(Math.floor(Math.random() * characters.length));
	}

	return addr;
}

export async function spamNetwork(
	wallets: ethers.Wallet[],
	count: number,
) {
	const minValue = ethers.utils.parseEther('0.00001')
	const walletsWithNonce = await Promise.all(
		wallets.map(async (wallet) => {
			const nonce = await wallet.getTransactionCount()
			return { wallet, nonce }
		}),
	)

	const startTime = Date.now()
	const transfers = walletsWithNonce.map(async ({ wallet, nonce }) => {
		console.log(`Spamming ${count} transactions from ${wallet.address}... Nonce: ${nonce}`);
		// log time from start
		const currentTime = Date.now()
		const elapsedTime = currentTime - startTime
		const elapsedTimeInSeconds = (elapsedTime / 1000).toFixed(2)
		console.log(`Elapsed time: ${elapsedTimeInSeconds} seconds`)
		console.log(`Elapsed time: ${elapsedTime}ms`)
		const transfers = Array(count).fill(null).map(async (_, index) => {
			try {
				const randomAddress = generateRandomEthAddress()
				return wallet.sendTransaction({
					to: randomAddress,
					value: minValue,
					nonce: nonce + index,
				})
			} catch (error) {
				console.error('Spam transaction failed:', error)
				return null
			}
		})
		return Promise.all(transfers)
	})

	const results = await Promise.all(flatten(transfers))
	const endTime = Date.now()
	const totalTime = endTime - startTime
	const timeInSeconds = (totalTime / 1000).toFixed(2)
	console.log(`Spam completed in ${timeInSeconds} seconds`)
	console.log(`Spam completed in ${totalTime}ms`)

	const totalSpam = wallets.length * count
	console.log("TPS:", (totalSpam / (totalTime / 1000)).toFixed(2));


	return flatten(results)
}
