'use client'

import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {useWallet} from '@/contexts/WalletContext'

export default function NetworkSelector() {
	const {networks, selectedNetwork, setSelectedNetwork} = useWallet()

	return (
		<Select
			value={selectedNetwork?.id ?? ''}
			onValueChange={(value) => {
				const network = networks.find((n) => n.id === value)
				if (network) setSelectedNetwork(network)
			}}>
			<SelectTrigger className='w-[250px]'>
				<SelectValue placeholder='Select network to connect' />
			</SelectTrigger>
			<SelectContent>
				{networks.map((network) => (
					<SelectItem key={network.id} value={network.id}>
						{network.name} ({network.symbol}) - {network.rpcUrls.length} RPCs
					</SelectItem>
				))}
			</SelectContent>
		</Select>
	)
}
