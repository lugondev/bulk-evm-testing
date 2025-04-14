'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useWallet} from '@/contexts/WalletContext'
import type {Network, RpcUrl} from '@/types/database'
import {api} from '@/lib/api'

interface EditNetworkData {
	name: string
	chainId: string
	symbol: string
	isTestnet: boolean
	rpcUrls: string[]
}

export default function NetworkManagement() {
	const {selectedNetwork, setSelectedNetwork} = useWallet()
	const [networks, setNetworks] = useState<Network[]>([])
	const [isAddingNetwork, setIsAddingNetwork] = useState(false)
	const [isEditingNetwork, setIsEditingNetwork] = useState(false)
	const [networkToEdit, setNetworkToEdit] = useState<Network | null>(null)
	const [newNetwork, setNewNetwork] = useState<EditNetworkData>({
		name: '',
		chainId: '',
		symbol: '',
		isTestnet: false,
		rpcUrls: [''],
	})

	const [editNetwork, setEditNetwork] = useState<EditNetworkData>({
		name: '',
		chainId: '',
		symbol: '',
		isTestnet: false,
		rpcUrls: [''],
	})

	useEffect(() => {
		loadNetworks()
	}, [])

	async function loadNetworks() {
		try {
			const networks = await api.getNetworks()
			setNetworks(networks)
		} catch (error) {
			console.error('Failed to load networks:', error)
		}
	}

	const resetForm = () => {
		setNewNetwork({
			name: '',
			chainId: '',
			symbol: '',
			isTestnet: false,
			rpcUrls: [''],
		})
		setEditNetwork({
			name: '',
			chainId: '',
			symbol: '',
			isTestnet: false,
			rpcUrls: [''],
		})
	}

	async function addNetwork() {
		try {
			const network = await api.createNetwork({
				name: newNetwork.name,
				chainId: parseInt(newNetwork.chainId),
				symbol: newNetwork.symbol,
				isTestnet: newNetwork.isTestnet,
				rpcUrls: newNetwork.rpcUrls.filter((url) => url.trim()),
			})
			setNetworks([...networks, network])
			setIsAddingNetwork(false)
			resetForm()
		} catch (error) {
			console.error('Failed to add network:', error)
		}
	}

	async function startEditNetwork(network: Network) {
		setNetworkToEdit(network)
		setEditNetwork({
			name: network.name,
			chainId: network.chainId.toString(),
			symbol: network.symbol,
			isTestnet: network.isTestnet,
			rpcUrls: network.rpcUrls.map((rpc) => rpc.url),
		})
		setIsEditingNetwork(true)
	}

	async function saveEditNetwork() {
		if (!networkToEdit) return

		try {
			// Update basic network info
			const updatedNetwork = await api.updateNetwork(networkToEdit.id, {
				name: editNetwork.name,
				chainId: parseInt(editNetwork.chainId),
				symbol: editNetwork.symbol,
				isTestnet: editNetwork.isTestnet,
			})

			// Handle RPC URL changes
			const oldUrls = networkToEdit.rpcUrls.map((rpc) => rpc.url)
			const newUrls = editNetwork.rpcUrls.filter((url) => url.trim())

			// Remove URLs that are no longer in the list
			for (const rpc of networkToEdit.rpcUrls) {
				if (!newUrls.includes(rpc.url)) {
					await api.deleteRpcUrl(networkToEdit.id, rpc.id)
				}
			}

			// Add new URLs
			for (const url of newUrls) {
				if (!oldUrls.includes(url)) {
					await api.addRpcUrl(networkToEdit.id, url)
				}
			}

			// Reload networks to get updated RPC list
			await loadNetworks()
			setIsEditingNetwork(false)
			resetForm()
			setNetworkToEdit(null)
		} catch (error) {
			console.error('Failed to update network:', error)
		}
	}

	async function deleteNetwork(id: string) {
		try {
			await api.deleteNetwork(id)
			if (selectedNetwork?.id === id) {
				setSelectedNetwork(null)
			}
			setNetworks(networks.filter((n) => n.id !== id))
		} catch (error) {
			console.error('Failed to delete network:', error)
		}
	}

	return (
		<div className='space-y-4'>
			<div className='flex justify-between items-center'>
				<h2 className='text-xl font-semibold'>Networks</h2>
				<Dialog open={isAddingNetwork} onOpenChange={setIsAddingNetwork}>
					<DialogTrigger asChild>
						<Button>Add Network</Button>
					</DialogTrigger>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Add New Network</DialogTitle>
						</DialogHeader>
						<div className='space-y-4'>
							<div>
								<Label htmlFor='name'>Name</Label>
								<Input id='name' value={newNetwork.name} onChange={(e) => setNewNetwork({...newNetwork, name: e.target.value})} />
							</div>
							<div>
								<Label>RPC URLs</Label>
								<div className='space-y-2'>
									{newNetwork.rpcUrls.map((url, index) => (
										<div key={index} className='flex gap-2'>
											<Input
												value={url}
												onChange={(e) => {
													const newUrls = [...newNetwork.rpcUrls]
													newUrls[index] = e.target.value
													setNewNetwork({...newNetwork, rpcUrls: newUrls})
												}}
												placeholder='Enter RPC URL'
											/>
											{index > 0 && (
												<Button
													variant='ghost'
													size='icon'
													className='h-8 w-8'
													onClick={() => {
														const newUrls = newNetwork.rpcUrls.filter((_, i) => i !== index)
														setNewNetwork({...newNetwork, rpcUrls: newUrls})
													}}>
													✕
												</Button>
											)}
										</div>
									))}
									<Button variant='outline' size='sm' onClick={() => setNewNetwork({...newNetwork, rpcUrls: [...newNetwork.rpcUrls, '']})}>
										Add RPC URL
									</Button>
								</div>
							</div>
							<div>
								<Label htmlFor='chainId'>Chain ID</Label>
								<Input id='chainId' type='number' value={newNetwork.chainId} onChange={(e) => setNewNetwork({...newNetwork, chainId: e.target.value})} />
							</div>
							<div>
								<Label htmlFor='symbol'>Symbol</Label>
								<Input id='symbol' value={newNetwork.symbol} onChange={(e) => setNewNetwork({...newNetwork, symbol: e.target.value})} />
							</div>
							<div className='flex items-center gap-2'>
								<input type='checkbox' id='isTestnet' checked={newNetwork.isTestnet} onChange={(e) => setNewNetwork({...newNetwork, isTestnet: e.target.checked})} />
								<Label htmlFor='isTestnet'>Is Testnet</Label>
							</div>
							<Button onClick={addNetwork} className='w-full'>
								Add Network
							</Button>
						</div>
					</DialogContent>
				</Dialog>
			</div>

			<div className='space-y-2'>
				{networks.map((network) => (
					<Card key={network.id} className={`p-3 cursor-pointer ${selectedNetwork?.id === network.id ? 'ring-2 ring-primary' : ''}`}>
						<div className='flex justify-between items-center'>
							<div>
								<p className='font-medium'>{network.name}</p>
								<div className='text-sm text-gray-500'>
									{network.rpcUrls.map((rpc, index) => (
										<p key={rpc.id}>
											{rpc.url}
											{!rpc.isActive && ' (inactive)'}
										</p>
									))}
								</div>
								<div className='flex gap-2 text-sm text-gray-500'>
									<span>Chain ID: {network.chainId}</span>
									<span>Symbol: {network.symbol}</span>
									{network.isTestnet && <span className='text-yellow-600'>Testnet</span>}
								</div>
							</div>
							<div className='flex gap-2'>
								<Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => startEditNetwork(network)}>
									✎
								</Button>
								<Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => deleteNetwork(network.id)}>
									✕
								</Button>
							</div>
						</div>
					</Card>
				))}

				<Dialog open={isEditingNetwork} onOpenChange={setIsEditingNetwork}>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Edit Network</DialogTitle>
						</DialogHeader>
						<div className='space-y-4'>
							<div>
								<Label htmlFor='edit-name'>Name</Label>
								<Input id='edit-name' value={editNetwork.name} onChange={(e) => setEditNetwork({...editNetwork, name: e.target.value})} />
							</div>
							<div>
								<Label>RPC URLs</Label>
								<div className='space-y-2'>
									{editNetwork.rpcUrls.map((url, index) => (
										<div key={index} className='flex gap-2'>
											<Input
												value={url}
												onChange={(e) => {
													const newUrls = [...editNetwork.rpcUrls]
													newUrls[index] = e.target.value
													setEditNetwork({...editNetwork, rpcUrls: newUrls})
												}}
												placeholder='Enter RPC URL'
											/>
											{index > 0 && (
												<Button
													variant='ghost'
													size='icon'
													className='h-8 w-8'
													onClick={() => {
														const newUrls = editNetwork.rpcUrls.filter((_, i) => i !== index)
														setEditNetwork({...editNetwork, rpcUrls: newUrls})
													}}>
													✕
												</Button>
											)}
										</div>
									))}
									<Button variant='outline' size='sm' onClick={() => setEditNetwork({...editNetwork, rpcUrls: [...editNetwork.rpcUrls, '']})}>
										Add RPC URL
									</Button>
								</div>
							</div>
							<div>
								<Label htmlFor='edit-chainId'>Chain ID</Label>
								<Input id='edit-chainId' type='number' value={editNetwork.chainId} onChange={(e) => setEditNetwork({...editNetwork, chainId: e.target.value})} />
							</div>
							<div>
								<Label htmlFor='edit-symbol'>Symbol</Label>
								<Input id='edit-symbol' value={editNetwork.symbol} onChange={(e) => setEditNetwork({...editNetwork, symbol: e.target.value})} />
							</div>
							<div className='flex items-center gap-2'>
								<input type='checkbox' id='edit-isTestnet' checked={editNetwork.isTestnet} onChange={(e) => setEditNetwork({...editNetwork, isTestnet: e.target.checked})} />
								<Label htmlFor='edit-isTestnet'>Is Testnet</Label>
							</div>
							<Button onClick={saveEditNetwork} className='w-full'>
								Save Changes
							</Button>
						</div>
					</DialogContent>
				</Dialog>

				{networks.length === 0 && <p className='text-center text-gray-500 py-4'>No networks configured. Add one to get started.</p>}
			</div>
		</div>
	)
}
