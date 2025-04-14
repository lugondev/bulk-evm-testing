'use client'

import Link from 'next/link'

export function Header() {
	return (
		<header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
			<div className='container flex h-14 items-center'>
				<div className='mr-4 flex'>
					<Link href='/' className='mr-6 flex items-center space-x-2'>
						<span className='font-bold sm:inline-block'>EVM Benchmark</span>
					</Link>
				</div>
				<nav className='flex items-center space-x-6 text-sm font-medium'>
					<Link href='/wallets' className='transition-colors hover:text-foreground/80'>
						Wallets
					</Link>
					<Link href='/transfer' className='transition-colors hover:text-foreground/80'>
						Transfer
					</Link>
					<Link href='/contracts' className='transition-colors hover:text-foreground/80'>
						Contracts
					</Link>
				</nav>
			</div>
		</header>
	)
}
