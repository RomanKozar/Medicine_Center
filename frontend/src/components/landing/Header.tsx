'use client'
import {
	Bell,
	Calendar,
	LogOut,
	Settings,
	Stethoscope,
	User,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { getRoleLabel } from '@/lib/constant'
import {
	SLOT_NOTICE_EVENT,
	markSlotNoticeSeen,
	readSeenSlotNotices,
	unseenSlotNotices,
} from '@/lib/slotNotices'
import { userAuthStore } from '@/store/authStore'
import { useAppointmentStore } from '@/store/appointmentStore'

interface HeaderProps {
	showDashboardNav?: boolean
}

interface NavigationItem {
	lable: string
	icon: React.ComponentType<any>
	href: string
	active: boolean
}

const Header: React.FC<HeaderProps> = ({ showDashboardNav = false }) => {
	const { user, isAuthenticated, logout } = userAuthStore()
	const { appointments, fetchAppointments } = useAppointmentStore()
	const [seenNotices, setSeenNotices] = useState<Record<string, string>>({})
	const router = useRouter()

	const pathname = usePathname()
	const notices =
		user?.type === 'patient' ? unseenSlotNotices(appointments, seenNotices) : []

	useEffect(() => {
		setSeenNotices(readSeenSlotNotices())
		const sync = () => setSeenNotices(readSeenSlotNotices())
		window.addEventListener(SLOT_NOTICE_EVENT, sync)
		return () => window.removeEventListener(SLOT_NOTICE_EVENT, sync)
	}, [])

	useEffect(() => {
		if (user?.type === 'patient' && showDashboardNav) {
			fetchAppointments('patient')
		}
	}, [user, showDashboardNav, fetchAppointments])

	const handleLogout = () => {
		logout()
		router.push('/')
	}

	const getDashboardNavigation = (): NavigationItem[] => {
		if (!user || !showDashboardNav) return []

		if (user?.type === 'patient') {
			return [
				{
					lable: 'Записи',
					icon: Calendar,
					href: '/patient/dashboard',
					active: pathname?.includes('/patient/dashboard') || false,
				},
				{
					lable: 'Профіль',
					icon: User,
					href: '/patient/profile',
					active: pathname?.includes('/patient/profile') || false,
				},
				{
					lable: 'Налаштування',
					icon: Settings,
					href: '/patient/settings',
					active: pathname?.includes('/patient/settings') || false,
				},
			]
		} else if (user?.type === 'doctor') {
			return [
				{
					lable: 'Кабінет',
					icon: Calendar,
					href: '/doctor/dashboard',
					active: pathname?.includes('/doctor/dashboard') || false,
				},
				{
					lable: 'Записи',
					icon: Calendar,
					href: '/doctor/appointments',
					active: pathname?.includes('/doctor/appointments') || false,
				},
				{
					lable: 'Пріоритет',
					icon: Stethoscope,
					href: '/priority-rules',
					active: pathname?.includes('/priority-rules') || false,
				},
			]
		}
		return []
	}
	return (
		<header className='border-b bg-white/95 backdrop:blur-sm fixed top-0 left-0 right-0 z-50'>
			<div className='container mx-auto px-4 h-16 flex items-center  justify-between'>
				{/* Left side -> logo  + navigation */}
				<div className='flex items-center space-x-8'>
					<Link href='/' className='flex items-center space-x-2'>
						<div className='w-8 h-8 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center'>
							<Stethoscope className='w-5 h-5 text-white' />
						</div>

						<div className='text-2xl font-bold bg-gradient-to-br from-blue-600 to-blue-800  bg-clip-text text-transparent'>
							HealOnline
						</div>
					</Link>

					{/* Dashboard navigation */}
					{isAuthenticated && showDashboardNav && (
						<nav className='hidden md:flex items-center space-x-6'>
							{getDashboardNavigation().map(item => (
								<Link
									key={item.href}
									href={item.href}
									className={`flex items-center space-x-1 transition-colors ${
										item.active
											? 'text-blue-600 font-semibold'
											: 'text-gray-600 hover:text-blue-600'
									}`}
								>
									<item.icon className='w-4 h-4' />
									<span className='text-sm font-medium'>{item.lable}</span>
								</Link>
							))}
						</nav>
					)}
				</div>

				{isAuthenticated && showDashboardNav ? (
					<div className='flex items-center space-x-4'>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button variant='ghost' size='sm' className='relative'>
									<Bell className='w-5 h-5' />
									{notices.length > 0 && (
										<Badge className='absolute -top-1 -right-1 w-5 h-5 text-xs bg-red-500 hover:bg-red-600'>
											{notices.length}
										</Badge>
									)}
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-80'>
								<DropdownMenuLabel>Сповіщення</DropdownMenuLabel>
								<DropdownMenuSeparator />
								{notices.length === 0 ? (
									<p className='px-2 py-3 text-sm text-gray-500'>
										Немає нових сповіщень
									</p>
								) : (
									notices.map(notice => (
										<DropdownMenuItem key={`${notice.id}-${notice.at}`} asChild>
											<Link
												href={`/patient/dashboard?id=${notice.id}`}
												onClick={() => markSlotNoticeSeen(notice.id, notice.at)}
												className='flex flex-col items-start gap-1'
											>
												<span className='font-medium'>
													{notice.doctorName} змінив час прийому
												</span>
												<span className='text-xs text-gray-500'>
													Було {notice.fromLabel}. Стало {notice.toLabel}.
												</span>
											</Link>
										</DropdownMenuItem>
									))
								)}
							</DropdownMenuContent>
						</DropdownMenu>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant='ghost'
									className='flex items-center space-x-2 px-2'
								>
									<Avatar className='w-8 h-8'>
										<AvatarImage
											src={user?.profileImage}
											alt={user?.name}
										></AvatarImage>
										<AvatarFallback className='bg-blue-100 text-blue-600 text-sm font-semibold'>
											{user?.name?.charAt(0)?.toUpperCase()}
										</AvatarFallback>
									</Avatar>
									<div className='hidden md:block text-left'>
										<p className='text-sm font-medium text-gray-900'>
											{user?.name}
										</p>
										<p className='text-xs text-gray-500'>
											{user?.type ? getRoleLabel(user.type) : ''}
										</p>
									</div>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent align='end' className='w-56'>
								<DropdownMenuLabel>
									<div className='flex items-center space-x-2'>
										<Avatar className='w-10 h-10'>
											<AvatarImage
												src={user?.profileImage}
												alt={user?.name}
											></AvatarImage>
											<AvatarFallback className='bg-blue-100 text-blue-600 '>
												{user?.name?.charAt(0)?.toUpperCase()}
											</AvatarFallback>
										</Avatar>

										<div className='flex-1 min-w-0'>
											<p className=' font-medium truncate'>{user?.name}</p>
											<p className='text-sm text-gray-500 truncate max-w-[140px]'>
												{user?.email}
											</p>
										</div>
									</div>
								</DropdownMenuLabel>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link
										href={`/${user?.type}/profile`}
										className='flex items-center'
									>
										<User className='w-4 h-4 mr-2' />
										Профіль
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem asChild>
									<Link
										href={`/${user?.type}/settings`}
										className='flex items-center'
									>
										<Settings className='w-4 h-4 mr-2' />
										Налаштування
									</Link>
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onClick={handleLogout}
									className='text-red-600'
								>
									<LogOut className='w-4 h-4 mr-2' />
									Вийти
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				) : (
					<div className='flex items-center space-x-3'>
						{!isAuthenticated ? (
							<>
								<Link href='/advice'>
									<Button
										variant='ghost'
										className='text-blue-900 font-medium hover:text-blue-700 hidden lg:inline-flex'
									>
										Куди звернутися
									</Button>
								</Link>
								<Link href='/priority-rules'>
									<Button
										variant='ghost'
										className='text-blue-900 font-medium hover:text-blue-700 hidden md:inline-flex'
									>
										Як рахується пріоритет
									</Button>
								</Link>
								<Link href='/login/patient'>
									<Button
										variant='ghost'
										className='text-blue-900 font-medium hover:text-blue-700'
									>
										Увійти
									</Button>
								</Link>

								<Link href='/signup/patient' className='hidden md:block'>
									<Button className='bg-gradient-to-r from-blue-600 to-blue-700  font-medium hover:from-blue-700 hover:to-blue-800 rounded-full px-6'>
										Записатися на консультацію
									</Button>
								</Link>
							</>
						) : (
							<div className='flex items-center space-x-4 '>
								<span className='hidden md:block text-sm text-gray-700 font-medium whitespace-nowrap'>
									Вітаємо,&nbsp;{user?.name}
								</span>

								<Link href={`/${user?.type}/dashboard`}>
									<Button
										variant='ghost'
										className='text-blue-900 font-medium hover:text-blue-700'
									>
										Кабінет
									</Button>
								</Link>
							</div>
						)}
					</div>
				)}
			</div>
		</header>
	)
}

export default Header
