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
import prisma from '@/lib/prisma'
import {toast} from 'sonner'

interface TransferFormData {
	recipients: string // CSV format: address,amount\naddress2,amount2
	tokenAddress?: string
}

export default function BulkTransfer() {
	const {register, handleSubmit, watch} = useForm<TransferFormData>()
	const [isLoading, setIsLoading] = useState(false)
	const {provider} = useWallet()
	const recipientText = watch('recipients', '')

	const recipientCount = recipientText.split('\n').filter(Boolean).length

	const onSubmit = async (data: TransferFormData) => {
		if (!provider) {
			toast.error('Please select a network first')
			return
		}

		try {
			setIsLoading(true)

			const recipients = data.recipients
				.split('\n')
				.filter(Boolean)
				.map((line) => {
					const [address, amount] = line.split(',')
					return {address: address.trim(), amount: amount.trim()}
				})

			// Generate a new wallet for the transaction
			const wallet = ethers.Wallet.createRandom().connect(provider)

			// Save the wallet to the database
			await prisma.wallet.create({
				data: {
					address: wallet.address,
					name: `Transfer Wallet ${new Date().toISOString()}`,
				},
			})

			if (data.tokenAddress) {
				await bulkERC20Transfer({
					provider,
					wallet,
					recipients,
					tokenAddress: data.tokenAddress,
					prisma,
				})
			} else {
				await bulkNativeTransfer({
					provider,
					wallet,
					recipients,
					prisma,
				})
			}

			toast.success('Bulk transfer initiated')
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
							<Label>Recipients (address,amount per line)</Label>
							<Textarea
								placeholder='0x123...,0.1&#10;0x456...,0.2'
								rows={5}
								{...register('recipients')}
							/>
							<p className='text-sm text-gray-500'>{recipientCount} recipient(s)</p>
						</div>

						<Button type='submit' disabled={isLoading || !provider}>
							{isLoading ? 'Processing...' : 'Send'}
						</Button>
					</form>
				</TabsContent>

				<TabsContent value='erc20'>
					<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
						<div className='space-y-2'>
							<Label>Token Address</Label>
							<Input placeholder='0x...' {...register('tokenAddress')} />
						</div>

						<div className='space-y-2'>
							<Label>Recipients (address,amount per line)</Label>
							<Textarea
								placeholder='0x123...,100&#10;0x456...,200'
								rows={5}
								{...register('recipients')}
							/>
							<p className='text-sm text-gray-500'>{recipientCount} recipient(s)</p>
						</div>

						<Button type='submit' disabled={isLoading || !provider}>
							{isLoading ? 'Processing...' : 'Send'}
						</Button>
					</form>
				</TabsContent>
			</Tabs>
		</div>
	)
}
