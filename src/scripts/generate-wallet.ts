import { ethers } from "ethers"

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
	console.log("Generating wallets...");
	const wallets = generateWallets(100)
	wallets.forEach((wallet) => {
		console.log(`${wallet.address}|${wallet.privateKey}`)
	})
}

main()

