'use client'

import {useState} from 'react'
import {ethers} from 'ethers'
import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useWallet} from '@/contexts/WalletContext'
import {spamNetwork} from '@/lib/wallet'
import {toast} from 'sonner'

interface SpamFormData {
	count: string
}

export default function SpamNetwork() {
	const {register, handleSubmit} = useForm<SpamFormData>()
	const [isLoading, setIsLoading] = useState(false)
	const {getProvider, selectedWallets} = useWallet()

	const onSubmit = async (data: SpamFormData) => {
		if (!selectedWallets.length) {
			toast.error('Please select at least one wallet')
			return
		}
		const provider = getProvider()
		if (!provider) {
			toast.error('Provider not found')
			return
		}

		const count = parseInt(data.count)
		if (isNaN(count) || count <= 0) {
			toast.error('Please enter a valid number of transactions')
			return
		}

		const totalSpam = selectedWallets.length * count
		try {
			setIsLoading(true)
			await spamNetwork(
				selectedWallets.map((w) => new ethers.Wallet(w.privateKey, provider)),
				count,
			)
			toast.success(`Successfully sent ${totalSpam} transactions`)
		} catch (error) {
			console.error('Spam failed:', error)
			toast.error('Network spam failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
			<p className='text-sm text-gray-500'>Selected Wallets: {selectedWallets.length}</p>
			<p className='text-sm text-gray-500'>Each wallet will send {selectedWallets.length} transactions to random addresses</p>
			<div className='space-y-2'>
				<Label>Number of Transactions</Label>
				<Input type='number' min='1' placeholder='Enter number of transactions' {...register('count')} required />
				<p className='text-sm text-gray-500'>Each transaction will send a minimal amount of native tokens to random addresses</p>
			</div>

			<Button type='submit' disabled={isLoading || !selectedWallets.length} className='w-full'>
				{isLoading ? 'Spamming...' : 'Start Spam'}
			</Button>

			{isLoading && <p className='text-sm text-gray-500 animate-pulse'>Running stress test... This may take a while.</p>}
		</form>
	)
}
