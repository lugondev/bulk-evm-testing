'use client'

import {useState, useEffect} from 'react'
import type {ChangeEvent} from 'react'
import type {Wallet} from '@/types/database'
import NetworkSelector from './NetworkSelector'
import {Button} from '@/components/ui/button'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Form, FormControl, FormField, FormItem, FormLabel} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Tabs, TabsContent, TabsList, TabsTrigger} from '@/components/ui/tabs'
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from '@/components/ui/table'
import {useWallet} from '@/contexts/WalletContext'
import {zodResolver} from '@hookform/resolvers/zod'
import {useForm} from 'react-hook-form'
import {z} from 'zod'
import {ethers} from 'ethers'

type CreateWalletFormData = {
	count: number
}

type ImportWalletFormInput = {
	privateKey: string
}

type ImportWalletFormData = {
	privateKey: string[]
}

type WalletBalance = {
	native: string
	token: string
}

const createWalletSchema = z.object({
	count: z.number().min(1).max(100),
})

// Function to generate a random color for wallet icons
function generateRandomColor() {
	const hue = Math.floor(Math.random() * 360)
	return `hsl(${hue}, 70%, 60%)`
}

// Function to create a pie chart SVG for wallet icons
function createPieChartSVG(segments = 3) {
	const colors = Array.from({length: segments}, () => generateRandomColor())

	let paths = ''
	const total = 100
	let currentAngle = 0

	colors.forEach((color, index) => {
		const segmentSize = total / segments
		const endAngle = currentAngle + (segmentSize / 100) * Math.PI * 2

		const x1 = 10 + 10 * Math.cos(currentAngle)
		const y1 = 10 + 10 * Math.sin(currentAngle)
		const x2 = 10 + 10 * Math.cos(endAngle)
		const y2 = 10 + 10 * Math.sin(endAngle)

		const largeArcFlag = segmentSize > 50 ? 1 : 0

		const pathData = `M 10,10 L ${x1},${y1} A 10,10 0 ${largeArcFlag},1 ${x2},${y2} Z`

		paths += `<path d="${pathData}" fill="${color}" />`

		currentAngle = endAngle
	})

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">${paths}</svg>`
}

export default function WalletList() {
	const {networks, isConnecting, providers, getProvider, wallets, selectedWallets, setSelectedWallets, toggleWalletSelection, createWallet, importWallet, deleteWallet, tokenAddress, setTokenAddress} = useWallet()
	const [isOpen, setIsOpen] = useState(false)
	const [exportType, setExportType] = useState<'address' | 'privateKey' | 'wallet'>('address')

	const handleExport = () => {
		const data = selectedWallets.map((wallet) => (exportType === 'address' ? wallet.address : exportType === 'privateKey' ? wallet.privateKey : `${wallet.address}|${wallet.privateKey}`)).join('\n')

		const blob = new Blob([data], {type: 'text/plain'})
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		a.href = url
		a.download = `wallets-${exportType}-${new Date().toISOString().split('T')[0]}.txt`
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)
	}
	const [walletBalances, setWalletBalances] = useState<Record<string, WalletBalance>>({})
	const [walletIcons, setWalletIcons] = useState<Record<string, string>>({})
	const [isRefreshing, setIsRefreshing] = useState<Record<string, boolean>>({})
	const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null)

	const handleSelectAll = () => {
		const allSelected = wallets.length === selectedWallets.length
		if (allSelected) {
			setSelectedWallets([])
		} else {
			setSelectedWallets(wallets)
		}
	}

	const handleCheckboxChange = (wallet: Wallet, index: number, event: ChangeEvent<HTMLInputElement>) => {
		// Check shift key state from mouse event
		if (event.nativeEvent instanceof MouseEvent && event.nativeEvent.shiftKey && lastSelectedIndex !== null) {
			const start = Math.min(lastSelectedIndex, index)
			const end = Math.max(lastSelectedIndex, index)
			const selectedRange = wallets.slice(start, end + 1)
			const isSelected = selectedWallets.some((w) => w.id === wallet.id)

			if (isSelected) {
				// Deselect range
				const filtered = selectedWallets.filter((w) => !selectedRange.some((r) => r.id === w.id))
				setSelectedWallets(filtered)
			} else {
				// Select range
				const newSelection = [...selectedWallets]
				selectedRange.forEach((w) => {
					if (!selectedWallets.some((p) => p.id === w.id)) {
						newSelection.push(w)
					}
				})
				setSelectedWallets(newSelection)
			}
		} else {
			toggleWalletSelection(wallet)
		}
		setLastSelectedIndex(index)
	}

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

	// Generate wallet icons when wallets change
	useEffect(() => {
		const newIcons: Record<string, string> = {}
		wallets.forEach((wallet) => {
			if (!walletIcons[wallet.id]) {
				newIcons[wallet.id] = createPieChartSVG(Math.floor(Math.random() * 3) + 2)
			}
		})

		if (Object.keys(newIcons).length > 0) {
			setWalletIcons((prev) => ({...prev, ...newIcons}))
		}
	}, [wallets, walletIcons])

	// Fetch balances when provider, wallets, or token address changes
	useEffect(() => {
		if (wallets.length > 0) {
			fetchAllBalances()
		}
	}, [wallets, tokenAddress])

	const fetchAllBalances = async () => {
		for (const wallet of wallets) {
			fetchWalletBalance(wallet)
		}
	}

	const fetchWalletBalance = async (wallet: Wallet) => {
		const provider = getProvider(wallet)
		if (!provider) return

		setIsRefreshing((prev) => ({...prev, [wallet.address]: true}))

		try {
			// Fetch native token balance
			const balance = await provider.getBalance(wallet.address)
			const formattedBalance = ethers.utils.formatEther(balance)
			// get token balance
			const tokenContract = new ethers.Contract(tokenAddress, ['function balanceOf(address) view returns (uint256)'], provider)
			const tokenBalance = await tokenContract.balanceOf(wallet.address)
			const formattedTokenBalance = ethers.utils.formatUnits(tokenBalance, 18)

			setWalletBalances((prev) => ({
				...prev,
				[wallet.address]: {
					native: formattedBalance,
					token: formattedTokenBalance,
				},
			}))
		} catch (error) {
			console.error('Error fetching balance:', error)
		} finally {
			setIsRefreshing((prev) => ({...prev, [wallet.address]: false}))
		}
	}

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
				setSelectedWallets([firstWallet])
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

	// Function to truncate address for display
	const truncateAddress = (address: string) => {
		if (!address) return ''
		return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`
	}

	return (
		<div className='space-y-4'>
			<div className='space-y-4 mb-6'>
				<div className='flex flex-col gap-4'>
					<div className='items-center'>
						<div className='w-full xs:w-auto'>
							<NetworkSelector />
						</div>
						<div className='ml-0 xs:ml-2'>{isConnecting ? <span className='text-sm text-orange-500'>Connecting...</span> : providers.size > 0 ? <span className='text-sm text-green-500'>Connected</span> : <span className='text-sm text-gray-500'>Not connected</span>}</div>
					</div>
					<div className='flex gap-2 items-center'>
						<label htmlFor='tokenAddress' className='text-sm font-medium'>
							Token Address:
						</label>
						<Input id='tokenAddress' value={tokenAddress} onChange={(e) => setTokenAddress(e.target.value)} placeholder='Enter token address' className='w-[350px]' />
					</div>
				</div>
				{networks.length === 0 && <div className='text-sm text-red-500'>No networks available. Please add a network to get started.</div>}
			</div>

			{/* Responsive header: stack vertically on xs, row on sm+ */}
			<div className='flex flex-col items-start gap-4 sm:flex-row sm:justify-between sm:items-center'>
				<div className='flex items-center gap-2'>
					<h2 className='text-xl font-semibold'>My Wallets</h2>
					{selectedWallets.length > 0 && (
						<div className='flex items-center gap-2'>
							<select value={exportType} onChange={(e) => setExportType(e.target.value as 'address' | 'privateKey' | 'wallet')} className='h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors'>
								<option value='address'>Address</option>
								<option value='privateKey'>Private Key</option>
								<option value='wallet'>Address|Private Key</option>
							</select>
							<Button onClick={handleExport} size='sm'>
								Export Selected
							</Button>
						</div>
					)}
				</div>
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

			{/* Wallet Table */}
			<div className='overflow-x-auto rounded-lg border'>
				<Table>
					<TableHeader>
						<TableRow className='bg-gray-100'>
							<TableHead className='w-[50px]'>
								<div className='flex items-center gap-2'>
									<input type='checkbox' checked={wallets.length > 0 && wallets.length === selectedWallets.length} onChange={handleSelectAll} className='h-4 w-4 rounded border-gray-300' />
									No
								</div>
							</TableHead>
							<TableHead>
								Address
								<Button variant='ghost' size='sm' className='ml-1 h-4 w-4 p-0'>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
										<path fillRule='evenodd' d='M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z' clipRule='evenodd' />
									</svg>
								</Button>
							</TableHead>
							<TableHead>
								<div className='flex items-center gap-2'>
									Balance
									<Button variant='ghost' size='sm' className='ml-1 h-4 w-4 p-0'>
										<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
											<path fillRule='evenodd' d='M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z' clipRule='evenodd' />
										</svg>
									</Button>
									<Button variant='ghost' size='sm' className='h-6 w-6 p-0' onClick={() => fetchAllBalances()}>
										<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
											<path fillRule='evenodd' d='M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z' clipRule='evenodd' />
										</svg>
									</Button>
								</div>
							</TableHead>
							<TableHead>
								Token
								<Button variant='ghost' size='sm' className='ml-1 h-4 w-4 p-0'>
									<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
										<path fillRule='evenodd' d='M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z' clipRule='evenodd' />
									</svg>
								</Button>
							</TableHead>
							<TableHead className='text-center'>Transfer</TableHead>
							<TableHead className='w-[50px]'></TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{wallets.length > 0 ? (
							wallets.map((wallet, index) => (
								<TableRow key={wallet.id} className={`${selectedWallets.some((w) => w.id === wallet.id) ? 'bg-primary/5' : ''} hover:bg-gray-50`}>
									<TableCell className='font-medium'>
										<div className='flex items-center gap-2'>
											<input type='checkbox' checked={selectedWallets.some((w) => w.id === wallet.id)} onChange={(e) => handleCheckboxChange(wallet, index, e)} className='h-4 w-4 rounded border-gray-300' />
											{index + 1}
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center gap-2'>
											<div className='w-8 h-8 rounded-full overflow-hidden flex-shrink-0' dangerouslySetInnerHTML={{__html: walletIcons[wallet.id] || ''}}></div>
											<div className='flex flex-col'>
												<span className='font-medium'>Wallet {index}</span>
												<div className='flex items-center gap-1'>
													<span className='text-xs text-gray-500'>{truncateAddress(wallet.address)}</span>
													<button
														onClick={(e) => {
															e.stopPropagation()
															navigator.clipboard.writeText(wallet.address)
															const button = e.currentTarget
															button.classList.add('text-green-500')
															setTimeout(() => button.classList.remove('text-green-500'), 1000)
														}}
														className='p-1 hover:text-blue-500 transition-colors'>
														<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-3 h-3'>
															<path d='M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V12.5a1.5 1.5 0 01-1.5 1.5h-1v-3.379a3 3 0 00-.879-2.121L10.5 5.379A3 3 0 008.379 4.5H7v-1z' />
															<path d='M4.5 6A1.5 1.5 0 003 7.5v9A1.5 1.5 0 004.5 18h7a1.5 1.5 0 001.5-1.5v-5.879a1.5 1.5 0 00-.44-1.06L9.44 6.44A1.5 1.5 0 008.378 6H4.5z' />
														</svg>
													</button>
												</div>
											</div>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center'>
											<span>{walletBalances[wallet.address]?.native || '0'}</span>
											<Button
												variant='ghost'
												size='sm'
												className='ml-1 h-6 w-6 p-0'
												onClick={(e) => {
													e.stopPropagation()
													fetchWalletBalance(wallet)
												}}>
												<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
													<path fillRule='evenodd' d='M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z' clipRule='evenodd' />
												</svg>
											</Button>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex items-center'>
											<span>{walletBalances[wallet.address]?.token || '0.00'}</span>
											<Button
												variant='ghost'
												size='sm'
												className='ml-1 h-6 w-6 p-0'
												onClick={(e) => {
													e.stopPropagation()
													fetchWalletBalance(wallet)
												}}>
												<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4'>
													<path fillRule='evenodd' d='M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z' clipRule='evenodd' />
												</svg>
											</Button>
										</div>
									</TableCell>
									<TableCell>
										<div className='flex gap-2 justify-center'>
											<Button variant='outline' size='sm' className='px-3'>
												<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4 mr-1'>
													<path fillRule='evenodd' d='M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z' clipRule='evenodd' />
												</svg>
												ETH
											</Button>
											<Button variant='outline' size='sm' className='px-3'>
												<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-4 h-4 mr-1'>
													<path fillRule='evenodd' d='M13.2 2.24a.75.75 0 00.04 1.06l2.1 1.95H6.75a.75.75 0 000 1.5h8.59l-2.1 1.95a.75.75 0 101.02 1.1l3.5-3.25a.75.75 0 000-1.1l-3.5-3.25a.75.75 0 00-1.06.04zm-6.4 8a.75.75 0 00-1.06-.04l-3.5 3.25a.75.75 0 000 1.1l3.5 3.25a.75.75 0 101.02-1.1l-2.1-1.95h8.59a.75.75 0 000-1.5H4.66l2.1-1.95a.75.75 0 00.04-1.06z' clipRule='evenodd' />
												</svg>
												Token
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell colSpan={8} className='text-center py-8'>
									<div className='flex flex-col items-center'>
										<div className='inline-flex bg-gray-100 p-3 rounded-full mb-3'>
											<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-6 h-6 text-gray-500'>
												<path d='M6 5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v.205c.933.085 1.857.197 2.774.334 1.454.218 2.476 1.483 2.476 2.917v3.033c0 1.211-.734 2.352-1.936 2.752A24.726 24.726 0 0 1 12 15.75c-2.73 0-5.357-.442-7.814-1.259C3.084 14.092 2.35 12.951 2.35 11.74V8.706c0-1.434 1.022-2.7 2.476-2.917A48.814 48.814 0 0 1 7.6 5.455V5Z' />
												<path d='M4.375 15.9a24.32 24.32 0 0 0 3.832.962V18a3 3 0 0 1-3 3H4.5v-3a3 3 0 0 1-.125-2.1ZM14.375 18v-2.137a24.32 24.32 0 0 0 3.832-.963A3 3 0 0 1 18.082 18l.001 3h-.708a3 3 0 0 1-3-3Z' />
											</svg>
										</div>
										<p className='text-gray-500 mb-2'>No wallets yet</p>
										<p className='text-sm text-gray-400'>Create your first wallet to get started</p>
									</div>
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>
		</div>
	)
}
