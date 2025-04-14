'use client'

import {createContext, useContext, useEffect, useState} from 'react'
import {ethers} from 'ethers'
import type {Network, Wallet} from '@/types/database'
import {api} from '@/lib/api'
import {getWalletInstance} from '@/lib/wallet'

interface WalletContextType {
	provider: ethers.providers.JsonRpcProvider | null
	networks: Network[]
	selectedNetwork: Network | null
	setSelectedNetwork: (network: Network | null) => void
	isConnecting: boolean
	wallets: Wallet[]
	selectedWallet: Wallet | null
	setSelectedWallet: (wallet: Wallet | null) => void
	refreshWallets: () => Promise<void>
	refreshNetworks: () => Promise<void>
	createWallet: (quantity?: number) => Promise<Wallet>
	importWallet: (privateKey: string, name?: string) => Promise<Wallet>
	deleteWallet: (id: string) => Promise<void>
}

const WalletContext = createContext<WalletContextType>({
	provider: null,
	networks: [],
	selectedNetwork: null,
	setSelectedNetwork: () => {},
	isConnecting: false,
	wallets: [],
	selectedWallet: null,
	setSelectedWallet: () => {},
	refreshWallets: async () => {},
	refreshNetworks: async () => {},
	createWallet: async () => {
		throw new Error('WalletContext not initialized')
	},
	importWallet: async () => {
		throw new Error('WalletContext not initialized')
	},
	deleteWallet: async () => {},
})

export function WalletProvider({children}: {children: React.ReactNode}) {
	const [provider, setProvider] = useState<ethers.providers.JsonRpcProvider | null>(null)
	const [networks, setNetworks] = useState<Network[]>([])
	const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
	const [isConnecting, setIsConnecting] = useState(false)
	const [wallets, setWallets] = useState<Wallet[]>([])
	const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null)

	const refreshNetworks = async () => {
		try {
			const networks = await api.getNetworks()
			setNetworks(networks)
			if (networks.length > 0 && !selectedNetwork) {
				setSelectedNetwork(networks[0])
			}
		} catch (error) {
			console.error('Failed to refresh networks:', error)
		}
	}

	const refreshWallets = async () => {
		try {
			const wallets = await api.getWallets()
			setWallets(wallets)
		} catch (error) {
			console.error('Failed to refresh wallets:', error)
		}
	}

	const createWallet = async (quantity?: number) => {
		try {
			const wallet = await api.createWallet(quantity ?? 1)
			setWallets((prev) => [wallet, ...prev])
			if (!selectedWallet) {
				setSelectedWallet(wallet)
			}
			return wallet
		} catch (error) {
			console.error('Failed to create wallet:', error)
			throw error instanceof Error ? error : new Error('Failed to create wallet')
		}
	}

	const importWallet = async (privateKey: string, name?: string) => {
		// Format validation only, actual encryption happens in API
		try {
			// Validate private key format before sending to API
			try {
				const wallet = new ethers.Wallet(privateKey)
				if (!wallet.address) throw new Error('Invalid private key format')
			} catch (e) {
				throw new Error('Invalid private key format')
			}

			const wallet = await api.importWallet(privateKey, name)
			setWallets((prev) => [wallet, ...prev])
			if (!selectedWallet) {
				setSelectedWallet(wallet)
			}

			return wallet
		} catch (error) {
			console.error('Failed to import wallet:', error)
			throw error instanceof Error ? error : new Error('Failed to import wallet')
		}
	}

	const deleteWallet = async (id: string) => {
		try {
			await api.deleteWallet(id)
			if (selectedWallet?.id === id) {
				setSelectedWallet(null)
			}
			setWallets((prev) => prev.filter((w) => w.id !== id))
		} catch (error) {
			console.error('Failed to delete wallet:', error)
			throw error
		}
	}

	useEffect(() => {
		refreshNetworks()
		refreshWallets()
	}, [])

	useEffect(() => {
		if (selectedNetwork) {
			setIsConnecting(true)
			try {
				// Randomly select an active RPC URL
				const activeRpcUrls = selectedNetwork.rpcUrls.filter((rpc) => rpc.isActive)
				if (activeRpcUrls.length === 0) {
					throw new Error('No active RPC URLs available')
				}
				const randomRpc = activeRpcUrls[Math.floor(Math.random() * activeRpcUrls.length)]
				const newProvider = new ethers.providers.JsonRpcProvider(randomRpc.url)
				setProvider(newProvider)
			} catch (error) {
				console.error('Failed to connect to network:', error)
			} finally {
				setIsConnecting(false)
			}
		} else {
			setProvider(null)
		}
	}, [selectedNetwork])

	return (
		<WalletContext.Provider
			value={{
				provider,
				networks,
				selectedNetwork,
				setSelectedNetwork,
				isConnecting,
				wallets,
				selectedWallet,
				setSelectedWallet,
				refreshWallets,
				refreshNetworks,
				createWallet,
				importWallet,
				deleteWallet,
			}}>
			{children}
		</WalletContext.Provider>
	)
}

export const useWallet = () => useContext(WalletContext)
