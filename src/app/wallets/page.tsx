import {Card} from '@/components/ui/card'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import BulkTransfer from '@/components/wallets/BulkTransfer'
import DeployContract from '@/components/wallets/DeployContract'
import SpamNetwork from '@/components/wallets/SpamNetwork'
import WalletList from '@/components/wallets/WalletList'

export default function WalletsPage() {
	return (
		<main className='container mx-auto p-4 sm:p-6'>
			<div className='grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6'>
				<div className='space-y-4 col-span-1'>
					<Card className='p-4'>
						<WalletList />
					</Card>
				</div>

				<div className='col-span-1 md:col-span-3 space-y-4'>
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
			</div>
		</main>
	)
}
