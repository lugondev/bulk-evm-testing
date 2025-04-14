'use client'

import {useState} from 'react'
import {ethers} from 'ethers'
import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {useWallet} from '@/contexts/WalletContext'
import {bulkNativeTransfer, bulkERC20Transfer} from '@/lib/wallet'
import {toast} from 'sonner'

interface TransferFormData {
	recipients: string // address per line
	tokenAddress?: string
	minAmount?: string
	maxAmount?: string
	exactAmount?: string
}

type AmountMode = 'exact' | 'random'

export default function BulkTransfer() {
	const {register, handleSubmit, watch} = useForm<TransferFormData>()
	const [isLoading, setIsLoading] = useState(false)
	const [amountMode, setAmountMode] = useState<AmountMode>('exact')
	const {selectedNetwork, selectedWallets, getProvider} = useWallet()
	const recipientText = watch('recipients', '')

	const recipientCount = recipientText.split('\n').filter(Boolean).length

	const getRandomAmount = (min: string, max: string) => {
		// Generate a random amount between min and max
		if (!min || !max) return '0'
		if (parseFloat(min) > parseFloat(max)) {
			toast.error('Min amount cannot be greater than max amount')
			return '0'
		}
		if (parseFloat(min) <= 0 || parseFloat(max) <= 0) {
			toast.error('Amounts must be positive')
			return '0'
		}
		if (parseFloat(min) === parseFloat(max)) {
			return ethers.utils.parseEther(min)
		}
		const randomAmount = Math.random() * (parseFloat(max) - parseFloat(min)) + parseFloat(min)
		return ethers.utils.parseEther(randomAmount.toString()).toString()
	}

	const onSubmit = async (data: TransferFormData) => {
		if (!selectedNetwork || selectedWallets.length === 0) {
			toast.error('Please select a network and at least one wallet')
			return
		}

		try {
			setIsLoading(true)

			const addresses = data.recipients
				.split('\n')
				.filter(Boolean)
				.map((address) => address.trim())

			for (const wallet of selectedWallets) {
				const provider = getProvider(wallet)
				if (!provider) {
					toast.error(`No provider for wallet ${wallet.address}`)
					continue
				}

				const walletInstance = new ethers.Wallet(wallet.privateKey)

				const recipients = addresses.map((address) => ({
					address,
					amount: amountMode === 'random' ? getRandomAmount(data.minAmount || '0', data.maxAmount || '0') : data.exactAmount || '0',
				}))

				if (data.tokenAddress) {
					await bulkERC20Transfer({
						provider,
						wallet: walletInstance.connect(provider),
						recipients,
						tokenAddress: data.tokenAddress,
					})
				} else {
					await bulkNativeTransfer({
						provider,
						wallet: walletInstance.connect(provider),
						recipients,
					})
				}
			}

			toast.success('Bulk transfers completed')
		} catch (error) {
			console.error('Bulk transfer failed:', error)
			toast.error('Bulk transfer failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='space-y-4'>
			<Tabs defaultValue='native'>
				<TabsList className='grid w-full grid-cols-1 sm:grid-cols-2'>
					<TabsTrigger value='native'>Native Token</TabsTrigger>
					<TabsTrigger value='erc20'>ERC20 Token</TabsTrigger>
				</TabsList>

				<TabsContent value='native'>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
						<div className='space-y-2'>
							<Label className='block'>Recipients (one address per line)</Label>
							<Textarea
								placeholder='0x123...&#10;0x456...'
								rows={5}
								className='w-full'
								{...register('recipients')}
							/>
							<p className='text-sm text-gray-500'>{recipientCount} recipient(s)</p>
						</div>

						<Tabs value={amountMode} onValueChange={(v) => setAmountMode(v as AmountMode)}>
							<TabsList>
								<TabsTrigger value='exact'>Exact Amount</TabsTrigger>
								<TabsTrigger value='random'>Random Amount</TabsTrigger>
							</TabsList>

							<TabsContent value='exact' className='space-y-2'>
								<Label className='block'>Amount (ETH)</Label>
								<Input type='number' step='0.000000000000000001' placeholder='0.1' {...register('exactAmount')} />
							</TabsContent>

							<TabsContent value='random' className='space-y-2'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label className='block'>Min Amount (ETH)</Label>
										<Input type='number' step='0.000000000000000001' placeholder='0.1' {...register('minAmount')} />
									</div>
									<div>
										<Label className='block'>Max Amount (ETH)</Label>
										<Input type='number' step='0.000000000000000001' placeholder='0.2' {...register('maxAmount')} />
									</div>
								</div>
							</TabsContent>
						</Tabs>

						<Button type='submit' disabled={isLoading || !selectedNetwork || selectedWallets.length === 0}>
							{isLoading ? 'Processing...' : 'Send'}
						</Button>
					</form>
				</TabsContent>

				<TabsContent value='erc20'>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
						<div className='space-y-2'>
							<Label className='block'>Token Address</Label>
							<Input placeholder='0x...' className='w-full' {...register('tokenAddress')} />
						</div>

						<div className='space-y-2'>
							<Label className='block'>Recipients (one address per line)</Label>
							<Textarea
								placeholder='0x123...&#10;0x456...'
								rows={5}
								className='w-full'
								{...register('recipients')}
							/>
							<p className='text-sm text-gray-500'>{recipientCount} recipient(s)</p>
						</div>

						<Tabs value={amountMode} onValueChange={(v) => setAmountMode(v as AmountMode)}>
							<TabsList>
								<TabsTrigger value='exact'>Exact Amount</TabsTrigger>
								<TabsTrigger value='random'>Random Amount</TabsTrigger>
							</TabsList>

							<TabsContent value='exact' className='space-y-2'>
								<Label className='block'>Amount</Label>
								<Input type='number' step='0.000000000000000001' placeholder='100' {...register('exactAmount')} />
							</TabsContent>

							<TabsContent value='random' className='space-y-2'>
								<div className='grid grid-cols-2 gap-4'>
									<div>
										<Label className='block'>Min Amount</Label>
										<Input type='number' step='0.000000000000000001' placeholder='100' {...register('minAmount')} />
									</div>
									<div>
										<Label className='block'>Max Amount</Label>
										<Input type='number' step='0.000000000000000001' placeholder='200' {...register('maxAmount')} />
									</div>
								</div>
							</TabsContent>
						</Tabs>

						<Button type='submit' disabled={isLoading || !selectedNetwork || selectedWallets.length === 0}>
							{isLoading ? 'Processing...' : 'Send'}
						</Button>
					</form>
				</TabsContent>
			</Tabs>
		</div>
	)
}
