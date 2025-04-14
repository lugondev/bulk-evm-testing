'use client'

import {createContext, useCallback, useContext, useEffect, useState} from 'react'
import {ethers} from 'ethers'
import type {Network, Wallet} from '@/types/database'
import {api} from '@/lib/api'
import {getWalletInstance} from '@/lib/wallet'

interface WalletContextType {
	providers: Map<string, ethers.providers.JsonRpcProvider>
	networks: Network[]
	selectedNetwork: Network | null
	tokenAddress: string
	setTokenAddress: (address: string) => void
	setSelectedNetwork: (network: Network | null) => void
	isConnecting: boolean
	wallets: Wallet[]
	selectedWallets: Wallet[]
	setSelectedWallets: (wallets: Wallet[]) => void
	toggleWalletSelection: (wallet: Wallet) => void
	refreshWallets: () => Promise<void>
	refreshNetworks: () => Promise<void>
	createWallet: (quantity?: number) => Promise<Wallet>
	importWallet: (privateKey: string, name?: string) => Promise<Wallet>
	deleteWallet: (id: string) => Promise<void>
	getProvider: (wallet: Wallet) => ethers.providers.JsonRpcProvider | null
}

const WalletContext = createContext<WalletContextType>({
	providers: new Map(),
	networks: [],
	selectedNetwork: null,
	tokenAddress: '',
	setTokenAddress: () => {},
	setSelectedNetwork: () => {},
	isConnecting: false,
	wallets: [],
	selectedWallets: [],
	setSelectedWallets: () => {},
	toggleWalletSelection: () => {},
	refreshWallets: async () => {},
	refreshNetworks: async () => {},
	createWallet: async () => {
		throw new Error('WalletContext not initialized')
	},
	importWallet: async () => {
		throw new Error('WalletContext not initialized')
	},
	deleteWallet: async () => {},
	getProvider: () => null,
})

export function WalletProvider({children}: {children: React.ReactNode}) {
	const [providers, setProviders] = useState<Map<string, ethers.providers.JsonRpcProvider>>(new Map())
	const [networks, setNetworks] = useState<Network[]>([])
	const [selectedNetwork, setSelectedNetwork] = useState<Network | null>(null)
	const [tokenAddress, setTokenAddress] = useState<string>(() => {
		const saved = localStorage.getItem('tokenAddress')
		return saved || '0x6092390b3E3949C0140F5D6c695049b72af144D8'
	})

	useEffect(() => {
		localStorage.setItem('tokenAddress', tokenAddress)
	}, [tokenAddress])
	const [isConnecting, setIsConnecting] = useState(false)
	const [wallets, setWallets] = useState<Wallet[]>([])
	const [selectedWallets, setSelectedWallets] = useState<Wallet[]>([])

	const toggleWalletSelection = (wallet: Wallet) => {
		setSelectedWallets((prev) => {
			const isSelected = prev.some((w) => w.id === wallet.id)
			if (isSelected) {
				return prev.filter((w) => w.id !== wallet.id)
			}
			return [...prev, wallet]
		})
	}

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
			if (selectedWallets.length === 0) {
				setSelectedWallets([wallet])
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
			if (selectedWallets.length === 0) {
				setSelectedWallets([wallet])
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
			setSelectedWallets((prev) => prev.filter((w) => w.id !== id))
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

	const getProvider = useCallback(
		(wallet: Wallet) => {
			if (!selectedNetwork) return null
			if (providers.has(wallet.address)) {
				return providers.get(wallet.address) || null
			}

			const activeRpcUrls = selectedNetwork.rpcUrls.filter((rpc) => rpc.isActive)
			if (activeRpcUrls.length === 0) return null

			const randomRpc = activeRpcUrls[Math.floor(Math.random() * activeRpcUrls.length)]
			const newProvider = new ethers.providers.JsonRpcProvider(randomRpc.url)
			setProviders((prev) => new Map(prev).set(wallet.address, newProvider))
			return newProvider
		},
		[providers, selectedNetwork],
	)

	useEffect(() => {
		if (!selectedNetwork) {
			setProviders(new Map())
			return
		}

		if (wallets.length > 0) {
			setIsConnecting(true)
			try {
				const activeRpcUrls = selectedNetwork.rpcUrls.filter((rpc) => rpc.isActive)
				if (activeRpcUrls.length === 0) {
					setProviders(new Map())
					return
				}

				// Create providers for all wallets
				const newProviders = new Map<string, ethers.providers.JsonRpcProvider>()
				wallets.forEach((wallet) => {
					const randomRpc = activeRpcUrls[Math.floor(Math.random() * activeRpcUrls.length)]
					newProviders.set(wallet.address, new ethers.providers.JsonRpcProvider(randomRpc.url))
				})
				setProviders(newProviders)
			} catch (error) {
				console.error('Failed to initialize providers:', error)
			} finally {
				setIsConnecting(false)
			}
		} else {
			setProviders(new Map())
		}
	}, [wallets, selectedNetwork])

	return (
		<WalletContext.Provider
			value={{
				providers,
				networks,
				selectedNetwork,
				tokenAddress,
				setTokenAddress,
				setSelectedNetwork,
				isConnecting,
				wallets,
				selectedWallets,
				setSelectedWallets,
				toggleWalletSelection,
				refreshWallets,
				refreshNetworks,
				createWallet,
				importWallet,
				deleteWallet,
				getProvider,
			}}>
			{children}
		</WalletContext.Provider>
	)
}

export const useWallet = () => useContext(WalletContext)
