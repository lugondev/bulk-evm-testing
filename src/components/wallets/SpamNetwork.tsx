'use client'

import {useState} from 'react'
import {ethers} from 'ethers'
import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {useWallet} from '@/contexts/WalletContext'
import {spamNetwork} from '@/lib/wallet'
import prisma from '@/lib/prisma'
import {toast} from 'sonner'

interface SpamFormData {
	count: string
}

export default function SpamNetwork() {
	const {register, handleSubmit} = useForm<SpamFormData>()
	const [isLoading, setIsLoading] = useState(false)
	const {provider} = useWallet()

	const onSubmit = async (data: SpamFormData) => {
		if (!provider) {
			toast.error('Please select a network first')
			return
		}

		const count = parseInt(data.count)
		if (isNaN(count) || count <= 0) {
			toast.error('Please enter a valid number of transactions')
			return
		}

		try {
			setIsLoading(true)

			const wallet = ethers.Wallet.createRandom().connect(provider)

			// Save wallet to database
			await prisma.wallet.create({
				data: {
					address: wallet.address,
					name: `Spam Wallet ${new Date().toISOString()}`,
				},
			})

			const results = await spamNetwork(provider, wallet, count, prisma)

			const successCount = results.filter((r) => r.success).length
			toast.success(`Successfully sent ${successCount}/${count} transactions`)
		} catch (error) {
			console.error('Spam failed:', error)
			toast.error('Network spam failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
			<div className='space-y-2'>
				<Label>Number of Transactions</Label>
				<Input type='number' min='1' placeholder='Enter number of transactions' {...register('count')} required />
				<p className='text-sm text-gray-500'>Each transaction will send a minimal amount of native tokens to random addresses</p>
			</div>

			<Button type='submit' disabled={isLoading || !provider}>
				{isLoading ? 'Spamming...' : 'Start Spam'}
			</Button>

			{isLoading && <p className='text-sm text-gray-500 animate-pulse'>Running stress test... This may take a while.</p>}
		</form>
	)
}
