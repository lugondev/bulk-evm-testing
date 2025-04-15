import { ethers } from "ethers"
import { chunk } from "lodash"
import { spamNetwork } from "../lib/wallet"
import { privateKeys } from "./private-key.sensitive"

const listPrivateKeys = privateKeys

function randomProvider() {
	const providers = [
		"http://34.87.31.105:4001",
		"http://34.87.31.105:4002",
		// "http://34.87.31.105:4003",
	]
	const randomIndex = Math.floor(Math.random() * providers.length)
	return new ethers.providers.JsonRpcProvider(providers[randomIndex])
}

function main() {
	const wallets = listPrivateKeys.map((key) => {
		return new ethers.Wallet(key, randomProvider())
	})

	const spam = chunk(wallets, 1000).map((data) => {
		return spamNetwork(data, 1).then((txs) => {
			console.log(txs.filter(Boolean).length, "transactions sent");
			return txs;
		})
	})
	return Promise.all(spam)
}

main()
	.then(() => {
		console.log("Spam network completed successfully")
	})
	.catch((error) => {
		console.error("Error spamming network:", error)
	})