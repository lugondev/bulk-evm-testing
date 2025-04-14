import {Card} from '@/components/ui/card'
import NetworkManagement from '@/components/wallets/NetworkManagement'

export default function NetworksPage() {
	return (
		<main className='container mx-auto p-4 sm:p-6'>
			<div className='grid gap-4'>
				<Card className='p-4'>
					<NetworkManagement />
				</Card>
			</div>
		</main>
	)
}
