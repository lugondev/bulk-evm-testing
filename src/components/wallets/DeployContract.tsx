'use client'

import {useState} from 'react'
import {ethers} from 'ethers'
import {useForm} from 'react-hook-form'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {useWallet} from '@/contexts/WalletContext'
import {deployContract} from '@/lib/wallet'
import prisma from '@/lib/prisma'
import {toast} from 'sonner'

interface DeployFormData {
	bytecode: string
	abi: string
	constructorArgs: string
}

export default function DeployContract() {
	const {register, handleSubmit} = useForm<DeployFormData>()
	const [isLoading, setIsLoading] = useState(false)
	const {provider} = useWallet()

	const onSubmit = async (data: DeployFormData) => {
		if (!provider) {
			toast.error('Please select a network first')
			return
		}

		try {
			setIsLoading(true)

			let parsedAbi
			try {
				parsedAbi = JSON.parse(data.abi)
			} catch (e) {
				toast.error('Invalid ABI JSON format')
				return
			}

			let constructorArgs = []
			if (data.constructorArgs.trim()) {
				try {
					constructorArgs = JSON.parse(`[${data.constructorArgs}]`)
				} catch (e) {
					toast.error('Invalid constructor arguments format')
					return
				}
			}

			const wallet = ethers.Wallet.createRandom().connect(provider)

			// Save wallet to database
			await prisma.wallet.create({
				data: {
					address: wallet.address,
					name: `Deploy Wallet ${new Date().toISOString()}`,
				},
			})

			const result = await deployContract(provider, wallet, data.bytecode, parsedAbi, constructorArgs, prisma)

			if (result.success) {
				toast.success(`Contract deployed at ${result.address}`)
			} else {
				toast.error('Contract deployment failed')
			}
		} catch (error) {
			console.error('Deploy failed:', error)
			toast.error('Contract deployment failed')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
			<div className='space-y-2'>
				<Label>Contract Bytecode</Label>
				<Input placeholder='0x...' {...register('bytecode')} required />
			</div>

			<div className='space-y-2'>
				<Label>Contract ABI</Label>
				<Textarea placeholder='[{"inputs":[],"stateMutability":"nonpayable",...}]' rows={5} {...register('abi')} required />
			</div>

			<div className='space-y-2'>
				<Label>Constructor Arguments (comma separated)</Label>
				<Input placeholder='e.g. "Hello", 123, true' {...register('constructorArgs')} />
			</div>

			<Button type='submit' disabled={isLoading || !provider}>
				{isLoading ? 'Deploying...' : 'Deploy Contract'}
			</Button>
		</form>
	)
}
