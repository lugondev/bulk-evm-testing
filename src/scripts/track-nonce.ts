import { promises as fs } from 'fs';
import { privateKeys } from './private-key.sensitive';
import { ethers } from 'ethers';

const LOG_FILE = 'wallet_nonces.txt';

interface NonceHistory {
	nonces: number[];
}

interface NonceLog {
	[address: string]: NonceHistory;
}

async function readNonceLog(): Promise<NonceLog> {
	try {
		await fs.access(LOG_FILE);
		const data = await fs.readFile(LOG_FILE, 'utf8');
		const nonceLog: NonceLog = {};

		data.split('\n').forEach(line => {
			if (!line.trim()) return;

			const [address, nonceData] = line.split('|');
			if (address && nonceData) {
				// Parse nonce history from comma-separated values
				const nonces = nonceData.split(',').map(n => parseInt(n.trim()));
				nonceLog[address] = { nonces };
			}
		});

		return nonceLog;
	} catch (error: any) {
		if (error.code === 'ENOENT') {
			return {};
		}
		throw error;
	}
}

interface WalletData {
	wallet: {
		address: string;
	};
	nonce: number;
}

async function updateNonceLog(nonceData: WalletData[]): Promise<void> {
	try {
		const existingLog = await readNonceLog();
		const updatedAddresses = new Set<string>();
		let newLogContent = '';

		nonceData.forEach(({ wallet, nonce }) => {
			const address = wallet.address;
			// Get existing nonce history or initialize a new one
			const existingHistory = existingLog[address]?.nonces || [];
			// Add new nonce to history
			const updatedNonces = [...existingHistory, nonce];

			newLogContent += `${address}|${updatedNonces.join(',')}\n`;
			updatedAddresses.add(address);
		});

		// Keep existing data for addresses not updated in this run
		Object.entries(existingLog).forEach(([address, data]) => {
			if (!updatedAddresses.has(address)) {
				newLogContent += `${address}|${data.nonces.join(',')}\n`;
			}
		});

		await fs.writeFile(LOG_FILE, newLogContent);
		console.log(`Updated nonce for ${nonceData.length} wallets in ${LOG_FILE}`);
	} catch (error) {
		console.error('Error updating nonce log:', error);
		throw error;
	}
}

interface Wallet {
	address: string;
	getTransactionCount(): Promise<number>;
}

export async function trackWalletNonces(wallets: Wallet[]): Promise<WalletData[]> {
	try {
		// sum nonces
		let sumNonces = 0;
		const nonceData = await Promise.all(
			wallets.map(async (wallet) => {
				const nonce = await wallet.getTransactionCount();
				sumNonces += nonce;
				// console.log(`Nonce for ${wallet.address}: ${nonce}`);
				return { wallet, nonce };
			})
		);
		console.log(`Total nonces: ${sumNonces}`);

		await updateNonceLog(nonceData);
		return nonceData;
	} catch (error) {
		console.error('Error tracking nonces:', error);
		throw error;
	}
}

function randomProvider() {
	const providers = [
		"http://34.87.31.105:4001",
		"http://34.87.31.105:4002",
		// "http://34.87.31.105:4003",
	]
	const randomIndex = Math.floor(Math.random() * providers.length)
	return new ethers.providers.JsonRpcProvider(providers[randomIndex])
}

(async () => {
	const wallets = privateKeys.map((key) => {
		return new ethers.Wallet(key, randomProvider())
	})
	try {
		await trackWalletNonces(wallets);
		console.log("Nonce tracking completed successfully");
	} catch (error) {
		console.error("Error tracking nonces:", error);
	}
})();