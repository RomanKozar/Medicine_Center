'use client'
import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Header from '../landing/Header'
import { userAuthStore } from '@/store/authStore'
import { Appointment, useAppointmentStore } from '@/store/appointmentStore'
import { Card, CardContent } from '../ui/card'
import Link from 'next/link'
import { Button } from '../ui/button'
import {
	Calendar,
	Clock,
	FileText,
	Phone,
	Star,
	Video,
	XCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import {
	emptyStates,
	getConsultationTypeLabel,
	getPriorityColor,
	getSpecializationLabel,
	getStatusColor,
	getStatusLabel,
} from '@/lib/constant'
import { complaintOptions } from '@/lib/triage'
import PrescriptionViewModal from '../doctor/PrescriptionViewModal'
import PriorityNote from '../triage/PriorityNote'
import EmergencyBanner from '../triage/EmergencyBanner'
import PriorityHistory from '../triage/PriorityHistory'
import {
	SLOT_NOTICE_EVENT,
	markSlotNoticeSeen,
	readSeenSlotNotices,
	unseenSlotNotices,
} from '@/lib/slotNotices'

const cleanSymptoms = (text?: string) =>
	(text || '').replace(/^Демо-черга:\s*/, '').trim()

const complaintLabel = (id?: string) =>
	complaintOptions.find(item => item.id === id)?.label

const formatDate = (dateString: string) =>
	new Date(dateString).toLocaleDateString('uk-UA', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})

const formatShort = (dateString: string) =>
	new Date(dateString).toLocaleString('uk-UA', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	})

const isToday = (dateString: string) => {
	const today = new Date()
	return new Date(dateString).toDateString() === today.toDateString()
}

const canJoinCall = (appointment: Appointment) => {
	const appointmentTime = new Date(appointment.slotStartIso)
	const diffMintues = (appointmentTime.getTime() - Date.now()) / (1000 * 60)
	return (
		isToday(appointment.slotStartIso) &&
		diffMintues <= 15 &&
		diffMintues >= -120 &&
		(appointment.status === 'Scheduled' || appointment.status === 'In Progress')
	)
}

const canCancel = (appointment: Appointment) => appointment.status === 'Scheduled'

const splitAppointments = (appointments: Appointment[]) => {
	const now = new Date()
	const startOfToday = new Date()
	startOfToday.setHours(0, 0, 0, 0)
	const upcoming = appointments
		.filter(apt => {
			const aptDate = new Date(apt.slotStartIso)
			return (
				(apt.status === 'Scheduled' || apt.status === 'In Progress') &&
				(aptDate >= now || apt.status === 'In Progress')
			)
		})
		.sort((a, b) => {
			const aOld = new Date(a.slotStartIso) < startOfToday
			const bOld = new Date(b.slotStartIso) < startOfToday
			if (aOld !== bOld) return aOld ? 1 : -1
			return new Date(a.slotStartIso).getTime() - new Date(b.slotStartIso).getTime()
		})
	const past = appointments
		.filter(apt => {
			const aptDate = new Date(apt.slotStartIso)
			return (
				apt.status === 'Completed' ||
				apt.status === 'Cancelled' ||
				(apt.status === 'Scheduled' && aptDate < now)
			)
		})
		.sort(
			(a, b) => new Date(b.slotStartIso).getTime() - new Date(a.slotStartIso).getTime()
		)
	return { upcoming, past }
}

const VisitDetail = ({
	appointment,
	onCancel,
}: {
	appointment: Appointment
	onCancel: (id: string) => void
}) => {
	const doctor = appointment.doctorId
	const summary = cleanSymptoms(appointment.symptoms)
	const complaint = complaintLabel(appointment.triage?.complaint)
	const specialization = doctor?.specialization
		? getSpecializationLabel(doctor.specialization)
		: ''

	return (
		<Card
			id='appointment-detail'
			className={`scroll-mt-24 ${
				appointment.priorityLevel === 'emergency'
					? 'border-2 border-red-400 bg-red-50/40'
					: ''
			}`}
		>
			<CardContent className='p-5 space-y-4'>
				<div className='flex items-start justify-between gap-3'>
					<div>
						<h2 className='text-xl font-semibold text-gray-900'>{doctor?.name}</h2>
						<p className='text-sm text-gray-600'>{specialization || 'Лікар'}</p>
						{doctor?.hospitalInfo?.name && (
							<p className='text-sm text-gray-500'>{doctor.hospitalInfo.name}</p>
						)}
					</div>
					<Badge className={getStatusColor(appointment.status)}>
						{getStatusLabel(appointment.status)}
					</Badge>
				</div>

				<div className='text-sm text-gray-700 space-y-1'>
					<p>{formatDate(appointment.slotStartIso)}</p>
					<p>
						{getConsultationTypeLabel(appointment.consultationType)}
						{doctor?.fees ? ` · $${doctor.fees}` : ''}
					</p>
					{complaint && <p className='font-medium'>Скарга: {complaint}</p>}
					{summary && <p>{summary}</p>}
					{appointment.slotHistory && appointment.slotHistory.length > 0 && (
						<p className='text-xs text-gray-500'>
							Лікар змінив час. Попередньо:{' '}
							{formatDate(
								appointment.slotHistory[appointment.slotHistory.length - 1].from ||
									appointment.slotStartIso
							)}
						</p>
					)}
				</div>

				{appointment.priorityLevel === 'emergency' && (
					<EmergencyBanner audience='patient' />
				)}
				{appointment.priorityLevel && (
					<PriorityNote
						priority={{
							level: appointment.priorityLevel,
							levelLabel: appointment.priorityLabel,
							score: appointment.priorityScore,
							reasons:
								appointment.systemPriorityReasons || appointment.priorityReasons,
						}}
						systemLabel={
							appointment.priorityOverridden
								? appointment.systemPriorityLabel
								: undefined
						}
						overrideReason={
							appointment.priorityOverridden
								? appointment.priorityOverrideReason
								: undefined
						}
					/>
				)}
				<PriorityHistory history={appointment.priorityHistory} />

				<div className='flex flex-wrap items-center gap-2'>
					{canJoinCall(appointment) && (
						<Link href={`/call/${appointment._id}`}>
							<Button size='sm' className='bg-green-600 hover:bg-green-700'>
								<Video className='w-4 h-4 mr-2' />
								Приєднатися
							</Button>
						</Link>
					)}
					{canCancel(appointment) && (
						<Button
							variant='outline'
							size='sm'
							className='text-red-600 hover:text-red-700 hover:bg-red-50'
							onClick={() => onCancel(appointment._id)}
						>
							<XCircle className='w-4 h-4 mr-2' />
							Скасувати
						</Button>
					)}
					{appointment.status === 'Completed' && appointment.prescription && (
						<PrescriptionViewModal
							appointment={appointment}
							userType='patient'
							trigger={
								<Button
									variant='outline'
									size='sm'
									className='text-green-700 border-green-200 hover:bg-green-50'
								>
									<FileText className='w-4 h-4 mr-2' />
									Переглянути рецепт
								</Button>
							}
						/>
					)}
				</div>

				{appointment.status === 'Completed' && (
					<div className='flex items-center space-x-1'>
						{[...Array(5)].map((_, i) => (
							<Star key={i} className='w-4 h-4 fill-yellow-400 text-yellow-400' />
						))}
					</div>
				)}
			</CardContent>
		</Card>
	)
}

const EmptyState = ({ tab }: { tab: string }) => {
	const state = emptyStates[tab as keyof typeof emptyStates]
	const Icon = state.icon
	return (
		<Card>
			<CardContent className='p-12 text-center'>
				<Icon className='w-16 h-16 text-gray-300 mx-auto mb-4' />
				<h3 className='text-lg font-semibold text-gray-900 mb-2'>{state.title}</h3>
				<p className='text-gray-600'>{state.description}</p>
			</CardContent>
		</Card>
	)
}

const PatientAppointmentList = ({
	items,
	selectedId,
	selected,
	onOpen,
	onCancel,
	detailScrollRef,
}: {
	items: Appointment[]
	selectedId: string | null
	selected: Appointment | null
	onOpen: (id: string) => void
	onCancel: (id: string) => void
	detailScrollRef: React.RefObject<HTMLDivElement | null>
}) => (
	<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start lg:items-stretch lg:h-full lg:min-h-0 lg:overflow-hidden'>
		<div className='space-y-2 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1'>
			{items.map(appointment => {
				const doctor = appointment.doctorId
				const summary = cleanSymptoms(appointment.symptoms)
				const complaint = complaintLabel(appointment.triage?.complaint)
				const active = appointment._id === selectedId
				const specialization = doctor?.specialization
					? getSpecializationLabel(doctor.specialization)
					: ''
				return (
					<button
						key={appointment._id}
						type='button'
						onMouseDown={event => event.preventDefault()}
						onClick={() => onOpen(appointment._id)}
						className={`w-full text-left rounded-lg border bg-white px-3 py-3 transition-colors cursor-pointer ${
							active
								? 'border-blue-500 ring-2 ring-blue-100'
								: appointment.priorityLevel === 'emergency'
									? 'border-red-300 hover:bg-red-50/60'
									: 'border-gray-200 hover:bg-gray-50'
						}`}
					>
						<div className='flex items-center justify-between gap-3'>
							<div className='min-w-0'>
								<p className='font-semibold text-gray-900 truncate'>
									{doctor?.name}
									{specialization ? `, ${specialization}` : ''}
								</p>
								<p className='text-sm text-gray-600 truncate'>
									{complaint ? `${complaint}. ` : ''}
									{summary}
								</p>
							</div>
							<Badge className={`${getPriorityColor(appointment.priorityLevel || '')} shrink-0`}>
								{appointment.priorityLabel || 'Без оцінки'}
								{typeof appointment.priorityScore === 'number'
									? ` · ${appointment.priorityScore}`
									: ''}
							</Badge>
						</div>
						<div className='mt-1 flex items-center gap-3 text-xs text-gray-500'>
							<span>{formatShort(appointment.slotStartIso)}</span>
							{appointment.consultationType === 'Video Consultation' ? (
								<span className='inline-flex items-center gap-1'>
									<Video className='w-3 h-3' /> Відео
								</span>
							) : (
								<span className='inline-flex items-center gap-1'>
									<Phone className='w-3 h-3' /> Дзвінок
								</span>
							)}
							{appointment.priorityOverridden && <span>Змінено лікарем</span>}
							{isToday(appointment.slotStartIso) && (
								<span className='text-blue-600 font-semibold'>Сьогодні</span>
							)}
						</div>
					</button>
				)
			})}
		</div>
		<div
			ref={detailScrollRef}
			className='lg:min-h-0 lg:h-full lg:overflow-y-auto lg:overscroll-contain'
		>
			{selected ? (
				<VisitDetail key={selected._id} appointment={selected} onCancel={onCancel} />
			) : (
				<Card>
					<CardContent className='p-6 text-sm text-gray-600'>
						Оберіть запис, щоб побачити пояснення пріоритету і дії.
					</CardContent>
				</Card>
			)}
		</div>
	</div>
)

const PatientDashboardContent = () => {
	const searchParams = useSearchParams()
	const requestedId = searchParams.get('id')
	const { user } = userAuthStore()
	const { appointments, fetchAppointments, loading, cancelAppointment } =
		useAppointmentStore()
	const [activeTab, setActiveTab] = useState('upcoming')
	const [selectedId, setSelectedId] = useState<string | null>(requestedId)
	const [seenNotices, setSeenNotices] = useState<Record<string, string>>({})
	const [pendingDoctor, setPendingDoctor] = useState<{ id: string; name: string } | null>(
		null
	)
	const detailScrollRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (user?.type === 'patient') {
			fetchAppointments('patient')
		}
	}, [user, fetchAppointments])

	useEffect(() => {
		const id = sessionStorage.getItem('healonline-advice-doctor')
		const name = sessionStorage.getItem('healonline-advice-name')
		if (id) setPendingDoctor({ id, name: name || 'рекомендованого лікаря' })
	}, [])

	useEffect(() => {
		setSeenNotices(readSeenSlotNotices())
		const sync = () => setSeenNotices(readSeenSlotNotices())
		window.addEventListener(SLOT_NOTICE_EVENT, sync)
		return () => window.removeEventListener(SLOT_NOTICE_EVENT, sync)
	}, [])

	useEffect(() => {
		if (!user || user.type !== 'patient') return
		const { upcoming, past } = splitAppointments(appointments)
		if (requestedId && upcoming.some(item => item._id === requestedId)) {
			setActiveTab('upcoming')
			setSelectedId(requestedId)
			return
		}
		if (requestedId && past.some(item => item._id === requestedId)) {
			setActiveTab('past')
			setSelectedId(requestedId)
			return
		}
		const pool = activeTab === 'past' ? past : upcoming
		setSelectedId(current =>
			current && pool.some(item => item._id === current) ? current : pool[0]?._id || null
		)
	}, [appointments, activeTab, user, requestedId])

	useEffect(() => {
		if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0
	}, [selectedId])

	const handleCancel = async (appointmentId: string) => {
		if (!confirm('Скасувати цей запис? Час знову стане вільним.')) return
		try {
			await cancelAppointment(appointmentId)
			fetchAppointments('patient')
		} catch (error) {
			console.error('Failed to cancel appointment', error)
		}
	}

	const openAppointment = (appointmentId: string) => {
		setSelectedId(appointmentId)
	}

	if (!user) return null

	const { upcoming: upcomingAppointments, past: pastAppointments } =
		splitAppointments(appointments)
	const selected = appointments.find(item => item._id === selectedId) || null
	const notices = unseenSlotNotices(appointments, seenNotices)

	const openNotice = (id: string, at: string) => {
		const target = appointments.find(item => item._id === id)
		if (target) {
			const slot = new Date(target.slotStartIso)
			const upcoming =
				(target.status === 'Scheduled' || target.status === 'In Progress') &&
				(slot >= new Date() || target.status === 'In Progress')
			setActiveTab(upcoming ? 'upcoming' : 'past')
		}
		setSelectedId(id)
		markSlotNoticeSeen(id, at)
	}

	return (
		<>
			<Header showDashboardNav={true} />
			<div className='min-h-screen bg-gray-50 pt-16 lg:h-screen lg:overflow-hidden lg:flex lg:flex-col'>
				<div className='container mx-auto px-4 py-6 lg:flex lg:flex-col lg:flex-1 lg:min-h-0'>
					<div className='flex items-center justify-between mb-6 shrink-0'>
						<div>
							<h1 className='text-md md:text-3xl font-bold text-gray-900'>Мої записи</h1>
							<p className='text-xs md:text-lg text-gray-600'>
								Керуйте своїми медичними візитами
							</p>
						</div>
						<Link href='/doctor-list'>
							<Button>
								<Calendar className='w-4 h-4 mr-2' />
								Записатися <span className='hidden md:inline'>на прийом</span>
							</Button>
						</Link>
					</div>

					{pendingDoctor && (
						<div className='mb-4 flex flex-col gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between shrink-0'>
							<p className='text-sm text-blue-950'>
								Можна продовжити запис до {pendingDoctor.name}.
							</p>
							<Button size='sm' asChild>
								<Link
									href={`/patient/booking/${pendingDoctor.id}`}
									onClick={() => {
										sessionStorage.removeItem('healonline-advice-doctor')
										sessionStorage.removeItem('healonline-advice-name')
									}}
								>
									Продовжити запис
								</Link>
							</Button>
						</div>
					)}

					{notices.length > 0 && (
						<div className='mb-4 space-y-2 shrink-0'>
							{notices.map(notice => (
								<div
									key={`${notice.id}-${notice.at}`}
									className='flex flex-col gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'
								>
									<p className='text-sm text-amber-950'>
										<span className='font-semibold'>{notice.doctorName}</span> змінив
										час прийому. Було {notice.fromLabel}. Стало {notice.toLabel}.
									</p>
									<Button
										size='sm'
										variant='outline'
										onClick={() => openNotice(notice.id, notice.at)}
									>
										Відкрити запис
									</Button>
								</div>
							))}
						</div>
					)}

					<Tabs value={activeTab} onValueChange={setActiveTab} className='lg:flex-1 lg:min-h-0'>
						<TabsList className='grid w-full grid-cols-2'>
							<TabsTrigger value='upcoming' className='flex items-center space-x-2'>
								<Clock className='w-4 h-4' />
								<span>Майбутні ({upcomingAppointments.length})</span>
							</TabsTrigger>
							<TabsTrigger value='past' className='flex items-center space-x-2'>
								<Calendar className='w-4 h-4' />
								<span>Минулі ({pastAppointments.length})</span>
							</TabsTrigger>
						</TabsList>

						<TabsContent
							value='upcoming'
							className='lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden gap-3'
						>
							<p className='text-sm text-gray-600 shrink-0'>
								У списку пріоритет, лікар і коротка скарга. Пояснення відкривається
								після натискання на запис.
							</p>
							{loading ? (
								<div className='space-y-2'>
									{[...Array(6)].map((_, i) => (
										<div key={i} className='h-16 bg-white border rounded-lg animate-pulse' />
									))}
								</div>
							) : upcomingAppointments.length > 0 ? (
								<div className='lg:flex-1 lg:min-h-0'>
									<PatientAppointmentList
										items={upcomingAppointments}
										selectedId={selectedId}
										selected={selected}
										onOpen={openAppointment}
										onCancel={handleCancel}
										detailScrollRef={detailScrollRef}
									/>
								</div>
							) : (
								<EmptyState tab='upcoming' />
							)}
						</TabsContent>
						<TabsContent
							value='past'
							className='lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden'
						>
							{loading ? (
								<div className='space-y-2'>
									{[...Array(4)].map((_, i) => (
										<div key={i} className='h-16 bg-white border rounded-lg animate-pulse' />
									))}
								</div>
							) : pastAppointments.length > 0 ? (
								<div className='lg:flex-1 lg:min-h-0'>
									<PatientAppointmentList
										items={pastAppointments}
										selectedId={selectedId}
										selected={selected}
										onOpen={openAppointment}
										onCancel={handleCancel}
										detailScrollRef={detailScrollRef}
									/>
								</div>
							) : (
								<EmptyState tab='completed' />
							)}
						</TabsContent>
					</Tabs>
				</div>
			</div>
		</>
	)
}

export default PatientDashboardContent
