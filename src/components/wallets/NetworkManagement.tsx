'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useWallet} from '@/contexts/WalletContext'
import type {Network} from '@/types/database'
import {api} from '@/lib/api'

export default function NetworkManagement() {
	const {selectedNetwork, setSelectedNetwork} = useWallet()
	const [networks, setNetworks] = useState<Network[]>([])
	const [isAddingNetwork, setIsAddingNetwork] = useState(false)
	const [newNetwork, setNewNetwork] = useState({
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
			setNewNetwork({
				name: '',
				chainId: '',
				symbol: '',
				isTestnet: false,
				rpcUrls: [''],
			})
		} catch (error) {
			console.error('Failed to add network:', error)
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
								<Button variant='ghost' size='icon' className='h-8 w-8' onClick={() => deleteNetwork(network.id)}>
									✕
								</Button>
							</div>
						</div>
					</Card>
				))}

				{networks.length === 0 && <p className='text-center text-gray-500 py-4'>No networks configured. Add one to get started.</p>}
			</div>
		</div>
	)
}
