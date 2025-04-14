'use client'

import Link from 'next/link'
import {usePathname} from 'next/navigation'
import {cn} from '@/lib/utils'

export function NavMenu() {
	const pathname = usePathname()

	return (
		<nav className='flex gap-4 border-b mb-6 px-4 sm:px-6'>
			<Link href='/wallets' className={cn('py-4 border-b-2 -mb-px transition-colors', pathname === '/wallets' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-200')}>
				<div className='flex items-center gap-2'>
					<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5'>
						<path d='M1 4.25a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.75 2H3.25A2.25 2.25 0 0 0 1 4.25ZM1 7.25a3.733 3.733 0 0 1 2.25-.75h13.5c.844 0 1.623.279 2.25.75A2.25 2.25 0 0 0 16.75 5H3.25A2.25 2.25 0 0 0 1 7.25ZM7 8a1 1 0 0 1 1 1 2 2 0 1 0 4 0 1 1 0 1 1 2 0v3a1 1 0 0 1-1 1h-1a1 1 0 0 1-1-1v-1a2 2 0 1 0-4 0v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1h2Z' />
						<path d='M0 10.75A2.25 2.25 0 0 0 2.25 13h13.5A2.25 2.25 0 0 0 18 10.75v5.5A2.75 2.75 0 0 1 15.25 19H2.75A2.75 2.75 0 0 1 0 16.25v-5.5ZM3 10.5a1 1 0 1 0 0 2h.256a1 1 0 0 0 .968-.747l.5-2A1 1 0 0 0 3.75 8.5H3a1 1 0 0 0-1 1v1Z' />
					</svg>
					Wallets
				</div>
			</Link>
			<Link href='/networks' className={cn('py-4 border-b-2 -mb-px transition-colors', pathname === '/networks' ? 'border-primary text-primary' : 'border-transparent hover:border-gray-200')}>
				<div className='flex items-center gap-2'>
					<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='currentColor' className='w-5 h-5'>
						<path
							fillRule='evenodd'
							d='M9.638 1.093a.75.75 0 0 1 .724 0l2 1.104a.75.75 0 1 1-.724 1.313L10 2.607l-1.638.903a.75.75 0 1 1-.724-1.313l2-1.104ZM5.403 4.287a.75.75 0 0 1-.295 1.019l-.805.444.805.444a.75.75 0 0 1-.724 1.314L3.5 7.02v.73a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 1 .388-.657l1.996-1.1a.75.75 0 0 1 1.019.294Zm9.194 0a.75.75 0 0 1 1.02-.295l1.995 1.101A.75.75 0 0 1 18 5.75v2a.75.75 0 0 1-1.5 0v-.73l-.884.488a.75.75 0 0 1-.724-1.314l.806-.444-.806-.444a.75.75 0 0 1-.295-1.02ZM7.343 8.284a.75.75 0 0 1 1.02-.294L10 8.893l1.638-.903a.75.75 0 1 1 .724 1.313l-1.612.89v1.557a.75.75 0 0 1-1.5 0v-1.557l-1.612-.89a.75.75 0 0 1-.295-1.019ZM2.75 11.5a.75.75 0 0 1 .75.75v1.557l1.612.89a.75.75 0 0 1-.724 1.314l-2-1.103a.75.75 0 0 1-.388-.657v-2a.75.75 0 0 1 .75-.75Zm14.5 0a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.388.657l-2 1.103a.75.75 0 0 1-.724-1.314l1.612-.89V12.25a.75.75 0 0 1 .75-.75Zm-9.5 4a.75.75 0 0 1 .75.75v.73l.884-.488a.75.75 0 0 1 .724 1.314l-1.996 1.101A.75.75 0 0 1 8 18.25v-2a.75.75 0 0 1 .75-.75ZM12 16.25a.75.75 0 0 1 .75.75v2a.75.75 0 0 1-.388.657l-1.996-1.1a.75.75 0 0 1 .724-1.314l.884.487v-.73a.75.75 0 0 1 .75-.75Z'
							clipRule='evenodd'
						/>
					</svg>
					Networks
				</div>
			</Link>
		</nav>
	)
}
