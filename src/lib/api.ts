import type { Network, Wallet, RpcUrl } from '@/types/database'

interface CreateNetworkData {
	name: string
	chainId: number
	symbol: string
	isTestnet: boolean
	rpcUrls: string[]
}

interface UpdateNetworkData {
	name?: string
	chainId?: number
	symbol?: string
	isTestnet?: boolean
}

async function fetchApi<T>(path: string, options: RequestInit = {}): Promise<T> {
	const response = await fetch(`/api${path}`, {
		...options,
		headers: {
			'Content-Type': 'application/json',
			...options.headers,
		},
	})

	const data = await response.json()

	if (!response.ok) {
		throw new Error(data.error || 'API request failed')
	}

	return data as T
}

export const api = {
	// Network operations
	getNetworks: () => fetchApi<Network[]>('/networks'),
	createNetwork: (data: CreateNetworkData) => fetchApi<Network>('/networks', {
		method: 'POST',
		body: JSON.stringify(data),
	}),
	updateNetwork: (id: string, data: UpdateNetworkData) => fetchApi<Network>(`/networks/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	}),
	deleteNetwork: (id: string) => fetchApi<{ success: true }>(`/networks/${id}`, {
		method: 'DELETE',
	}),

	// RPC operations
	addRpcUrl: (networkId: string, url: string) => fetchApi<RpcUrl>(`/networks/${networkId}/rpc`, {
		method: 'POST',
		body: JSON.stringify({ url }),
	}),
	updateRpcUrl: (networkId: string, rpcId: string, isActive: boolean) => fetchApi<RpcUrl>(`/networks/${networkId}/rpc`, {
		method: 'PUT',
		body: JSON.stringify({ rpcId, isActive }),
	}),
	deleteRpcUrl: (networkId: string, rpcId: string) => fetchApi<{ success: true }>(`/networks/${networkId}/rpc`, {
		method: 'DELETE',
		body: JSON.stringify({ rpcId }),
	}),

	// Wallet operations
	getWallets: () => fetchApi<Wallet[]>('/wallets'),
	createWallet: (quantity: number) => fetchApi<Wallet>('/wallets', {
		method: 'POST',
		body: JSON.stringify({ quantity }),
	}),
	importWallet: (privateKey: string, name?: string) => fetchApi<Wallet>('/wallets', {
		method: 'POST',
		body: JSON.stringify({ privateKey, name }),
	}),
	updateWallet: (id: string, data: { name: string }) => fetchApi<Wallet>(`/wallets/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data),
	}),
	deleteWallet: (id: string) => fetchApi<{ success: true }>(`/wallets/${id}`, {
		method: 'DELETE',
	}),
	getWallet: (id: string) => fetchApi<Wallet>(`/wallets/${id}`),
}
