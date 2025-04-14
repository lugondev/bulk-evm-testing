import {Card} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import BulkTransfer from '@/components/wallets/BulkTransfer'
import DeployContract from '@/components/wallets/DeployContract'
import SpamNetwork from '@/components/wallets/SpamNetwork'
import WalletList from '@/components/wallets/WalletList'

export default function WalletsPage() {
	return (
		<main className='container mx-auto p-4 sm:p-6 space-y-6'>
			<Card className='p-4'>
				<WalletList />
			</Card>

			<div className='space-y-4'>
				<Tabs defaultValue='transfer' className='w-full'>
					<TabsList className='grid w-full grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-0'>
						<TabsTrigger value='transfer'>Bulk Transfer</TabsTrigger>
						<TabsTrigger value='deploy'>Deploy Contract</TabsTrigger>
						<TabsTrigger value='spam'>Spam Network</TabsTrigger>
					</TabsList>

					<TabsContent value='transfer'>
						<Card className='p-4'>
							<BulkTransfer />
						</Card>
					</TabsContent>

					<TabsContent value='deploy'>
						<Card className='p-4'>
							<DeployContract />
						</Card>
					</TabsContent>

					<TabsContent value='spam'>
						<Card className='p-4'>
							<SpamNetwork />
						</Card>
					</TabsContent>
				</Tabs>
			</div>
		</main>
	)
}
