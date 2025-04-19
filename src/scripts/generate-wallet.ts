import { ethers } from "ethers"
import * as fs from "fs"

function generateWallets(amount: number) {
	// Generate a random wallet
	const wallets = []
	for (let i = 0; i < amount; i++) {
		const wallet = ethers.Wallet.createRandom()
		wallets.push({
			address: wallet.address,
			privateKey: wallet.privateKey,
			mnemonic: wallet.mnemonic.phrase,
		})
	}
	return wallets
}

function main() {
	console.log("Generating wallets...")
	const wallets = generateWallets(3000)

	// Create filename with timestamp
	const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
	const filename = `wallets-${timestamp}.txt`

	// Write wallet info to file
	wallets.forEach((wallet) => {
		// const walletInfo = `Address: ${wallet.address}\nPrivate Key: ${wallet.privateKey}\nMnemonic: ${wallet.mnemonic}\n\n`
		fs.appendFileSync(filename, wallet.privateKey + "\n")
	})
}

main()
