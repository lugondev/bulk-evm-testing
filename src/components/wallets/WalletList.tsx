'use client'

import {useState} from 'react'
import NetworkSelector from './NetworkSelector'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {api} from '@/lib/api'
import {useWallet} from '@/contexts/WalletContext'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'

type CreateWalletFormData = {
	count: number
}

type ImportWalletFormInput = {
	privateKey: string
}

type ImportWalletFormData = {
	privateKey: string[]
}

const createWalletSchema = z.object({
	count: z.number().min(1).max(100),
})

const importWalletSchema = z.object({
	privateKey: z
		.string()
		.min(1, 'Private key is required')
		.transform((value) =>
			value
				.split('\n')
				.map((key) => key.trim())
				.filter(Boolean),
		),
})

export default function WalletList() {
	const {networks, isConnecting, provider, wallets, selectedWallet, setSelectedWallet, createWallet, importWallet, deleteWallet} = useWallet()
	const [isOpen, setIsOpen] = useState(false)

	const createForm = useForm<CreateWalletFormData>({
		resolver: zodResolver(createWalletSchema),
		defaultValues: {
			count: 1,
		},
	})

	const importForm = useForm<ImportWalletFormInput>({
		resolver: zodResolver(
			z.object({
				privateKey: z.string().min(1, 'Private key is required'),
			}),
		),
		defaultValues: {
			privateKey: '',
		},
	})

	const handleCreateWallets = async (values: CreateWalletFormData) => {
		try {
			await createWallet(values.count)
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
			const privateKeys = Array.isArray(values.privateKey) ? values.privateKey : [values.privateKey]
			let firstWallet = null

			for (let i = 0; i < privateKeys.length; i++) {
				const wallet = await importWallet(privateKeys[i])
				if (!firstWallet) firstWallet = wallet
			}

			if (firstWallet) {
				setSelectedWallet(firstWallet)
			}
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
				<div className='flex flex-wrap items-center gap-3'>
					<div className='w-full xs:w-auto'>
						<NetworkSelector />
					</div>
					<div className='ml-0 xs:ml-2'>{isConnecting ? <span className='text-sm text-orange-500'>Connecting...</span> : provider ? <span className='text-sm text-green-500'>Connected</span> : <span className='text-sm text-gray-500'>Not connected</span>}</div>
				</div>
				{networks.length === 0 && <div className='text-sm text-red-500'>No networks available. Please add a network to get started.</div>}
			</div>

			{/* Responsive header: stack vertically on xs, row on sm+ */}
			<div className='flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center'>
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
					<DialogContent className='w-[95vw] max-w-[95vw] sm:max-w-[425px] p-4 sm:p-6'>
						<DialogHeader>
							<DialogTitle>Add New Wallet</DialogTitle>
						</DialogHeader>
						<Tabs defaultValue='create' className='w-full'>
							<TabsList className='grid w-full grid-cols-2'>
								<TabsTrigger value='create'>Create New</TabsTrigger>
								<TabsTrigger value='import'>Import</TabsTrigger>
							</TabsList>

							<TabsContent value='create' className='mt-4'>
								<Form {...createForm}>
									<form onSubmit={createForm.handleSubmit(handleCreateWallets)} className='space-y-5'>
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

							<TabsContent value='import' className='mt-4'>
								<Form {...importForm}>
									<form
										onSubmit={importForm.handleSubmit((values: ImportWalletFormInput) =>
											handleImportWallet({
												privateKey: values.privateKey
													.split('\n')
													.map((key: string) => key.trim())
													.filter((key: string) => key.length > 0),
											}),
										)}
										className='space-y-5'>
										<FormField
											control={importForm.control}
											name='privateKey'
											render={({field}) => (
												<FormItem>
													<FormLabel>Private Key</FormLabel>
													<FormControl>
														<Textarea {...field} placeholder='Enter private keys (one per line)' className='min-h-[100px]' />
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
						<div className='flex flex-col xs:flex-row justify-between gap-2 xs:items-center'>
							<div className='flex items-center gap-3'>
								<div className='p-2 bg-primary/10 rounded-full shrink-0'>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5 text-primary'>
										<path d='M6 5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259C3.084 14.092 2.35 12.951 2.35 11.74V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.6 5.455V5Z' />
										<path d='M4.375 15.9a24.32 24.32 0 0 0 3.832.962V18a3 3 0 0 1-3 3H4.5v-3a3 3 0 0 1-.125-2.1ZM14.375 18v-2.137a24.32 24.32 0 0 0 3.832-.963A3 3 0 0 1 18.082 18l.001 3h-.708a3 3 0 0 1-3-3Z' />
									</svg>
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-sm text-gray-500 truncate max-w-full' title={wallet.address}>
										{wallet.address}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-3 ml-auto'>
								<Button
									variant='ghost'
									size='icon'
									className='h-8 w-8 hover:bg-red-50 hover:text-red-500 shrink-0'
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
