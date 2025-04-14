'use client'

import {useState} from 'react'
import NetworkSelector from './NetworkSelector'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {api} from '@/lib/api'
import {useWallet} from '@/contexts/WalletContext'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

type CreateWalletFormData = {
	name: string
	count: number
}

type ImportWalletFormData = {
	name: string
	privateKey: string
}

const createWalletSchema = z.object({
	name: z.string().min(1, 'Wallet name is required').max(50, 'Wallet name must be less than 50 characters'),
	count: z.number().min(1).max(100),
})

const importWalletSchema = z.object({
	name: z.string().min(1, 'Wallet name is required').max(50, 'Wallet name must be less than 50 characters'),
	privateKey: z.string().min(1, 'Private key is required'),
})

export default function WalletList() {
	const {networks, isConnecting, provider, wallets, selectedWallet, setSelectedWallet, createWallet, importWallet, deleteWallet} = useWallet()
	const [isOpen, setIsOpen] = useState(false)

	const createForm = useForm<CreateWalletFormData>({
		resolver: zodResolver(createWalletSchema),
		defaultValues: {
			name: `Wallet ${wallets.length + 1}`,
			count: 1,
		},
	})

	const importForm = useForm<ImportWalletFormData>({
		resolver: zodResolver(importWalletSchema),
		defaultValues: {
			name: `Imported Wallet ${wallets.length + 1}`,
			privateKey: '',
		},
	})

	const handleCreateWallets = async (values: CreateWalletFormData) => {
		try {
			for (let i = 0; i < values.count; i++) {
				const name = values.count === 1 ? values.name : `${values.name} ${i + 1}`
				const wallet = await createWallet(name)
				if (i === 0) {
					setSelectedWallet(wallet)
				}
			}
			setIsOpen(false)
			createForm.reset()
		} catch (error) {
			console.error('Error creating wallets:', error)
			if (error instanceof Error) {
				alert(error.message)
			} else {
				alert('Failed to create wallet')
			}
		}
	}

	const handleImportWallet = async (values: ImportWalletFormData) => {
		try {
			const wallet = await importWallet(values.privateKey, values.name)
			setSelectedWallet(wallet)
			setIsOpen(false)
			importForm.reset()
		} catch (error) {
			console.error('Error importing wallet:', error)
			if (error instanceof Error) {
				alert(error.message)
			} else {
				alert('Failed to import wallet')
			}
		}
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-4 mb-6'>
				<div className='flex items-center gap-3'>
					<NetworkSelector />
					{isConnecting ? <span className='text-sm text-orange-500'>Connecting...</span> : provider ? <span className='text-sm text-green-500'>Connected</span> : <span className='text-sm text-gray-500'>Not connected</span>}
				</div>
				{networks.length === 0 && <div className='text-sm text-red-500'>No networks available. Please add a network to get started.</div>}
			</div>

			<div className='flex justify-between items-center'>
				<h2 className='text-xl font-semibold'>My Wallets</h2>
				<Dialog open={isOpen} onOpenChange={setIsOpen}>
					<DialogTrigger asChild>
						<Button>
							<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5 mr-2'>
								<path d='M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z' />
							</svg>
							Create Wallet
						</Button>
					</DialogTrigger>
					<DialogContent className='sm:max-w-[425px]'>
						<DialogHeader>
							<DialogTitle>Add New Wallet</DialogTitle>
						</DialogHeader>
						<Tabs defaultValue='create' className='w-full'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='create'>Create New</TabsTrigger>
								<TabsTrigger value='import'>Import</TabsTrigger>
							</TabsList>

							<TabsContent value='create'>
								<Form {...createForm}>
									<form onSubmit={createForm.handleSubmit(handleCreateWallets)} className='space-y-4'>
										<FormField
											control={createForm.control}
											name='name'
											render={({field}) => (
												<FormItem>
													<FormLabel>Wallet Name</FormLabel>
													<FormControl>
														<Input {...field} placeholder='Enter wallet name' />
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={createForm.control}
											name='count'
											render={({field}) => (
												<FormItem>
													<FormLabel>Number of Wallets</FormLabel>
													<FormControl>
														<Input type='number' min={1} max={100} {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
													</FormControl>
												</FormItem>
											)}
										/>
										<div className='flex justify-end'>
											<Button type='submit'>Create Wallets</Button>
										</div>
									</form>
								</Form>
							</TabsContent>

							<TabsContent value='import'>
								<Form {...importForm}>
									<form onSubmit={importForm.handleSubmit(handleImportWallet)} className='space-y-4'>
										<FormField
											control={importForm.control}
											name='name'
											render={({field}) => (
												<FormItem>
													<FormLabel>Wallet Name</FormLabel>
													<FormControl>
														<Input {...field} placeholder='Enter wallet name' />
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={importForm.control}
											name='privateKey'
											render={({field}) => (
												<FormItem>
													<FormLabel>Private Key</FormLabel>
													<FormControl>
														<Input {...field} type='password' placeholder='Enter private key' />
													</FormControl>
												</FormItem>
											)}
										/>
										<div className='flex justify-end'>
											<Button type='submit'>Import Wallet</Button>
										</div>
									</form>
								</Form>
							</TabsContent>
						</Tabs>
					</DialogContent>
				</Dialog>
			</div>

			<div className='space-y-2'>
				{wallets.map((wallet) => (
					<Card key={wallet.id} className={`p-3 cursor-pointer hover:bg-gray-50 transition-colors ${selectedWallet?.id === wallet.id ? 'ring-2 ring-primary' : ''}`} onClick={() => setSelectedWallet(wallet)}>
						<div className='flex justify-between items-center'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-primary/10 rounded-full'>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5 text-primary'>
										<path d='M6 5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259C3.084 14.092 2.35 12.951 2.35 11.74V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.6 5.455V5Z' />
										<path d='M4.375 15.9a24.32 24.32 0 0 0 3.832.962V18a3 3 0 0 1-3 3H4.5v-3a3 3 0 0 1-.125-2.1ZM14.375 18v-2.137a24.32 24.32 0 0 0 3.832-.963A3 3 0 0 1 18.082 18l.001 3h-.708a3 3 0 0 1-3-3Z' />
									</svg>
								</div>
								<div>
									<p className='font-medium'>{wallet.name}</p>
									<p className='text-sm text-gray-500 truncate'>{wallet.address}</p>
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<div className='flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full'>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4 text-gray-500'>
										<path d='M7 4a3 3 0 0 1 6 0v6a3 3 0 1 1-6 0V4Z' />
										<path d='M5.5 9.643a.75.75 0 0 0-1.5 0V10c0 3.06 2.29 5.585 5.25 5.954V17.5h-1.5a.75.75 0 0 0 0 1.5h4.5a.75.75 0 0 0 0-1.5h-1.5v-1.546A6.001 6.001 0 0 0 16 10v-.357a.75.75 0 0 0-1.5 0V10a4.5 4.5 0 0 1-9 0v-.357Z' />
									</svg>
									<span className='text-sm text-gray-500'>{wallet.transactions.length}</span>
								</div>
								<Button
									variant='ghost'
									size='icon'
									className='h-8 w-8 hover:bg-red-50 hover:text-red-500'
									onClick={(e) => {
										e.stopPropagation()
										deleteWallet(wallet.id)
									}}>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5'>
										<path fillRule='evenodd' d='M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z' clipRule='evenodd' />
									</svg>
								</Button>
							</div>
						</div>
					</Card>
				))}

				{wallets.length === 0 && (
					<div className='text-center py-8'>
						<div className='inline-flex bg-gray-100 p-3 rounded-full mb-3'>
							<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-6 h-6 text-gray-500'>
								<path d='M6 5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259C3.084 14.092 2.35 12.951 2.35 11.74V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.6 5.455V5Z' />
								<path d='M4.375 15.9a24.32 24.32 0 0 0 3.832.962V18a3 3 0 0 1-3 3H4.5v-3a3 3 0 0 1-.125-2.1ZM14.375 18v-2.137a24.32 24.32 0 0 0 3.832-.963A3 3 0 0 1 18.082 18l.001 3h-.708a3 3 0 0 1-3-3Z' />
							</svg>
						</div>
						<p className='text-gray-500 mb-2'>No wallets yet</p>
						<p className='text-sm text-gray-400'>Create your first wallet to get started</p>
					</div>
				)}
			</div>
		</div>
	)
}
