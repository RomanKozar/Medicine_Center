'use client'
import React, { useEffect, useRef, useState } from 'react'
import Header from '../landing/Header'
import { useSearchParams } from 'next/navigation'
import { userAuthStore } from '@/store/authStore'
import { Appointment, useAppointmentStore } from '@/store/appointmentStore'
import { getWithAuth } from '@/service/httpService'
import { convertTo24Hour, minutesToTime, toLocalYMD } from '@/lib/dateUtils'
import { Card, CardContent } from '../ui/card'
import Link from 'next/link'
import { Button } from '../ui/button'
import {
	Calendar,
	Clock,
	Phone,
	Star,
	Stethoscope,
	Video,
	XCircle,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Badge } from '../ui/badge'
import {
	emptyStates,
	getConsultationTypeLabel,
	getPriorityColor,
	getStatusColor,
	getStatusLabel,
} from '@/lib/constant'
import { complaintOptions } from '@/lib/triage'
import PriorityNote from '../triage/PriorityNote'
import EmergencyBanner from '../triage/EmergencyBanner'
import PriorityHistory from '../triage/PriorityHistory'
import PrescriptionViewModal from './PrescriptionViewModal'

const cleanSymptoms = (text?: string) =>
	(text || '').replace(/^Демо-черга:\s*/, '').trim()

const complaintLabel = (id?: string) =>
	complaintOptions.find(item => item.id === id)?.label

const formatDate = (dateString: string) => {
	return new Date(dateString).toLocaleDateString('uk-UA', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const formatShort = (dateString: string) => {
	return new Date(dateString).toLocaleString('uk-UA', {
		day: 'numeric',
		month: 'short',
		hour: '2-digit',
		minute: '2-digit',
	})
}

const isToday = (dateString: string) => {
	const today = new Date()
	const appointmentDate = new Date(dateString)
	return appointmentDate.toDateString() === today.toDateString()
}

const canJoinCall = (appointment: Appointment) => {
	const appointmentTime = new Date(appointment.slotStartIso)
	const now = new Date()
	const diffMintues = (appointmentTime.getTime() - now.getTime()) / (1000 * 60)

	return (
		isToday(appointment.slotStartIso) &&
		diffMintues <= 15 &&
		diffMintues >= -120 &&
		(appointment.status === 'Scheduled' || appointment.status === 'In Progress')
	)
}

const timeToMinutes = (timeStr: string) => {
	const [hours, minutes] = timeStr.split(':').map(Number)
	return hours * 60 + minutes
}

const buildDaySlots = (
	ranges: { start: string; end: string }[],
	duration: number
) => {
	const slots: string[] = []
	ranges.forEach(range => {
		const start = timeToMinutes(range.start)
		const end = timeToMinutes(range.end)
		for (let minutes = start; minutes < end; minutes += duration) {
			slots.push(minutesToTime(minutes))
		}
	})
	return slots
}

const AppointmentDetail = ({
	appointment,
	onCancel,
	overridePriority,
	onReschedule,
}: {
	appointment: Appointment
	onCancel: (id: string) => void
	overridePriority: (id: string, level: string, reason: string) => Promise<void>
	onReschedule: (id: string, slotStartIso: string) => Promise<void>
}) => {
	const [overrideOpen, setOverrideOpen] = useState(false)
	const [nextLevel, setNextLevel] = useState(appointment.priorityLevel || 'planned')
	const [overrideReason, setOverrideReason] = useState('')
	const [overrideError, setOverrideError] = useState('')
	const [savingOverride, setSavingOverride] = useState(false)
	const [timeOpen, setTimeOpen] = useState(false)
	const [timeDate, setTimeDate] = useState('')
	const [timeSlot, setTimeSlot] = useState('')
	const [bookedTimes, setBookedTimes] = useState<string[]>([])
	const [daySlots, setDaySlots] = useState<string[]>([])
	const [timeError, setTimeError] = useState('')
	const [savingTime, setSavingTime] = useState(false)
	const [excludedWeekdays, setExcludedWeekdays] = useState<number[]>([])
	const canChangePriority =
		appointment.status === 'Scheduled' || appointment.status === 'In Progress'

	useEffect(() => {
		if (!timeOpen || !timeDate) return
		let active = true
		getWithAuth('doctor/me')
			.then(profile => {
				if (!active) return
				const duration = profile.data?.slotDurationMinutes || 30
				setDaySlots(buildDaySlots(profile.data?.dailyTimeRanges || [], duration))
				setExcludedWeekdays(profile.data?.availabilityRange?.excludedWeekdays || [])
			})
			.catch(() => {
				if (active) setTimeError('Не вдалося прочитати графік лікаря')
			})
		getWithAuth<string[]>(`appointment/booked-slots/${appointment.doctorId?._id || appointment.doctorId}/${timeDate}`)
			.then(response => {
				if (active) setBookedTimes(response.data || [])
			})
			.catch(() => {
				if (active) setBookedTimes([])
			})
		return () => {
			active = false
		}
	}, [timeOpen, timeDate, appointment.doctorId])
	const summary = cleanSymptoms(appointment.symptoms)
	const complaint = complaintLabel(appointment.triage?.complaint)

	const openTimeForm = () => {
		setTimeDate(toLocalYMD(new Date(appointment.slotStartIso)))
		setTimeSlot('')
		setTimeError('')
		setTimeOpen(true)
	}

	const slotTaken = (slot: string) => {
		const slotTime = new Date(`${timeDate}T${convertTo24Hour(slot)}`).getTime()
		const current = new Date(appointment.slotStartIso).getTime()
		if (slotTime === current) return false
		return bookedTimes.some(item => new Date(item).getTime() === slotTime)
	}

	const dayExcluded = () => {
		if (!timeDate) return false
		const day = new Date(`${timeDate}T12:00:00`).getDay()
		return excludedWeekdays.includes(day)
	}

	const saveTime = async () => {
		if (!timeDate || !timeSlot) {
			setTimeError('Оберіть дату і вільну годину')
			return
		}
		if (slotTaken(timeSlot) || dayExcluded()) {
			setTimeError('Цей час недоступний')
			return
		}
		setSavingTime(true)
		setTimeError('')
		try {
			const slotStartIso = new Date(
				`${timeDate}T${convertTo24Hour(timeSlot)}`
			).toISOString()
			await onReschedule(appointment._id, slotStartIso)
			setTimeOpen(false)
		} catch (error: any) {
			setTimeError(error?.message || 'Не вдалося змінити час')
		} finally {
			setSavingTime(false)
		}
	}

	const savePriority = async () => {
		if (nextLevel === appointment.priorityLevel) {
			setOverrideError('Оберіть інший пріоритет')
			return
		}
		if (overrideReason.trim().length < 10) {
			setOverrideError('Причина має містити щонайменше 10 символів')
			return
		}
		setSavingOverride(true)
		setOverrideError('')
		try {
			await overridePriority(appointment._id, nextLevel, overrideReason.trim())
			setOverrideOpen(false)
			setOverrideReason('')
		} catch {
			setOverrideError('Не вдалося зберегти зміну')
		} finally {
			setSavingOverride(false)
		}
	}

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
						<h2 className='text-xl font-semibold text-gray-900'>
							{appointment.patientId?.name}
						</h2>
						<p className='text-sm text-gray-600'>
							Вік: {appointment.patientId?.age ?? '—'}
							{appointment.patientId?.phone
								? ` · ${appointment.patientId.phone}`
								: ''}
						</p>
						<p className='text-sm text-gray-500'>{appointment.patientId?.email}</p>
					</div>
					<Badge className={getStatusColor(appointment.status)}>
						{getStatusLabel(appointment.status)}
					</Badge>
				</div>

				<div className='text-sm text-gray-700 space-y-1'>
					<p>{formatDate(appointment.slotStartIso)}</p>
					<p>
						{getConsultationTypeLabel(appointment.consultationType)}
						{appointment.doctorId?.fees ? ` · $${appointment.doctorId.fees}` : ''}
					</p>
					{complaint && <p className='font-medium'>Скарга: {complaint}</p>}
					{summary && <p>{summary}</p>}
					{appointment.slotHistory && appointment.slotHistory.length > 0 && (
						<p className='text-xs text-gray-500'>
							Час змінено. Попередньо:{' '}
							{formatDate(
								appointment.slotHistory[appointment.slotHistory.length - 1].from || ''
							)}
						</p>
					)}
				</div>

				{appointment.priorityLevel === 'emergency' && (
					<EmergencyBanner audience='doctor' />
				)}
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
				{appointment.specialtyMatch && appointment.specialtyNote && (
					<p className='text-xs text-blue-700'>{appointment.specialtyNote}</p>
				)}
				<PriorityHistory history={appointment.priorityHistory} />

				{canChangePriority && (
					<div className='space-y-3'>
						<div className='flex flex-wrap gap-2'>
							{!overrideOpen && (
								<Button variant='outline' size='sm' onClick={() => setOverrideOpen(true)}>
									Змінити пріоритет
								</Button>
							)}
							{!timeOpen && (
								<Button variant='outline' size='sm' onClick={openTimeForm}>
									<Clock className='w-4 h-4 mr-2' />
									Змінити час
								</Button>
							)}
						</div>
						{timeOpen && (
							<div className='space-y-3 rounded-lg border bg-white p-3'>
								<label className='block text-sm font-medium text-gray-800'>
									Нова дата
									<input
										type='date'
										value={timeDate}
										onChange={event => {
											setTimeDate(event.target.value)
											setTimeSlot('')
										}}
										className='mt-1 w-full rounded-md border px-3 py-2'
									/>
								</label>
								{dayExcluded() ? (
									<p className='text-sm text-gray-600'>
										Цей день виключено з графіка прийому.
									</p>
								) : (
									<div className='flex flex-wrap gap-2'>
										{daySlots.map(slot => {
											const taken = slotTaken(slot)
											const selected = timeSlot === slot
											return (
												<button
													key={slot}
													type='button'
													disabled={taken}
													onClick={() => setTimeSlot(slot)}
													className={`rounded-md border px-2 py-1 text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-40 ${
														selected
															? 'border-blue-500 bg-blue-50 text-blue-700'
															: 'border-gray-200 hover:bg-gray-50'
													}`}
												>
													{slot}
												</button>
											)
										})}
									</div>
								)}
								{timeError && <p className='text-sm text-red-600'>{timeError}</p>}
								<div className='flex gap-2'>
									<Button size='sm' onClick={saveTime} disabled={savingTime}>
										{savingTime ? 'Збереження...' : 'Зберегти час'}
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => setTimeOpen(false)}
									>
										Скасувати
									</Button>
								</div>
							</div>
						)}
						{overrideOpen && (
							<div className='space-y-3 rounded-lg border bg-white p-3'>
								<label className='block text-sm font-medium text-gray-800'>
									Новий пріоритет
									<select
										value={nextLevel}
										onChange={event => setNextLevel(event.target.value)}
										className='mt-1 w-full rounded-md border px-3 py-2 bg-white'
									>
										<option value='emergency'>Невідкладно</option>
										<option value='urgent'>Терміново</option>
										<option value='planned'>Планово</option>
										<option value='routine'>Може зачекати</option>
									</select>
								</label>
								<label className='block text-sm font-medium text-gray-800'>
									Причина зміни
									<textarea
										value={overrideReason}
										onChange={event => setOverrideReason(event.target.value)}
										rows={3}
										placeholder='Чому рішення системи потрібно змінити'
										className='mt-1 w-full rounded-md border px-3 py-2'
									/>
								</label>
								{overrideError && (
									<p className='text-sm text-red-600'>{overrideError}</p>
								)}
								<div className='flex gap-2'>
									<Button size='sm' onClick={savePriority} disabled={savingOverride}>
										{savingOverride ? 'Збереження...' : 'Зберегти'}
									</Button>
									<Button
										size='sm'
										variant='outline'
										onClick={() => setOverrideOpen(false)}
									>
										Скасувати
									</Button>
								</div>
							</div>
						)}
					</div>
				)}

				<div className='flex flex-wrap items-center gap-2'>
					{canJoinCall(appointment) && (
						<Link href={`/call/${appointment._id}`}>
							<Button size='sm' className='bg-green-600 hover:bg-green-700'>
								<Video className='w-4 h-4 mr-2' />
								Почати консультацію
							</Button>
						</Link>
					)}
					{appointment.status === 'Scheduled' && (
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
							userType='doctor'
							trigger={
								<Button
									variant='outline'
									size='sm'
									className='text-green-700 border-green-200 hover:bg-green-50'
								>
									<Stethoscope className='w-4 h-4 mr-2' />
									Переглянути звіт
								</Button>
							}
						/>
					)}
					{appointment.status === 'Completed' && (
						<div className='flex items-center space-x-1'>
							{[...Array(5)].map((_, i) => (
								<Star
									key={i}
									className='w-4 h-4 fill-yellow-400 text-yellow-400'
								/>
							))}
						</div>
					)}
				</div>
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
				<p className='text-gray-600 mb-6'>{state.description}</p>
			</CardContent>
		</Card>
	)
}

const DoctorAppointmentList = ({
	items,
	selectedId,
	selected,
	onOpen,
	onCancel,
	overridePriority,
	onReschedule,
	detailScrollRef,
}: {
	items: Appointment[]
	selectedId: string | null
	selected: Appointment | null
	onOpen: (id: string) => void
	onCancel: (id: string) => void
	overridePriority: (id: string, level: string, reason: string) => Promise<void>
	onReschedule: (id: string, slotStartIso: string) => Promise<void>
	detailScrollRef: React.RefObject<HTMLDivElement | null>
}) => (
	<div className='grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-4 items-start lg:items-stretch lg:h-full lg:min-h-0 lg:overflow-hidden'>
		<div className='space-y-2 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:pr-1'>
			{items.map(appointment => {
				const summary = cleanSymptoms(appointment.symptoms)
				const complaint = complaintLabel(appointment.triage?.complaint)
				const active = appointment._id === selectedId
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
									{appointment.patientId?.name}
									{appointment.patientId?.age
										? `, ${appointment.patientId.age}`
										: ''}
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
				<AppointmentDetail
					key={selected._id}
					appointment={selected}
					onCancel={onCancel}
					overridePriority={overridePriority}
					onReschedule={onReschedule}
				/>
			) : (
				<Card>
					<CardContent className='p-6 text-sm text-gray-600'>
						Оберіть запис, щоб побачити пояснення пріоритету, протокол змін і дії.
					</CardContent>
				</Card>
			)}
		</div>
	</div>
)

const DoctorAppointmentContent = () => {
	const searchParams = useSearchParams()
	const requestedId = searchParams.get('id')
	const { user } = userAuthStore()
	const {
		appointments,
		fetchAppointments,
		loading,
		overridePriority,
		rescheduleAppointment,
		cancelAppointment,
	} = useAppointmentStore()
	const [activeTab, setActiveTab] = useState('upcoming')
	const [selectedId, setSelectedId] = useState<string | null>(requestedId)
	const detailScrollRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (user?.type === 'doctor') {
			fetchAppointments('doctor')
		}
	}, [user, fetchAppointments])

	useEffect(() => {
		if (requestedId) setSelectedId(requestedId)
	}, [requestedId])

	useEffect(() => {
		if (detailScrollRef.current) detailScrollRef.current.scrollTop = 0
	}, [selectedId])

	const now = new Date()
	const startOfToday = new Date()
	startOfToday.setHours(0, 0, 0, 0)
	const upcomingAppointments = appointments
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
			return 0
		})
	const pastAppointments = appointments
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

	const handleMarkCancelled = async (appointmentId: string) => {
		if (confirm('Ви впевнені, що хочете скасувати цей запис?')) {
			try {
				await cancelAppointment(appointmentId)
				if (user?.type === 'doctor') {
					fetchAppointments('doctor')
				}
			} catch (error) {
				console.error('Failed to mark cancel appointment', error)
			}
		}
	}

	const openAppointment = (appointmentId: string) => {
		setSelectedId(appointmentId)
	}

	const handleReschedule = async (appointmentId: string, slotStartIso: string) => {
		await rescheduleAppointment(appointmentId, slotStartIso)
		fetchAppointments('doctor')
	}

	if (!user) {
		return null
	}

	const selected = appointments.find(item => item._id === selectedId) || null

	return (
		<>
			<Header showDashboardNav={true} />

			<div className='min-h-screen bg-gray-50 pt-16 lg:h-screen lg:overflow-hidden lg:flex lg:flex-col'>
				<div className='container mx-auto px-4 py-6 lg:flex lg:flex-col lg:flex-1 lg:min-h-0'>
					<div className='flex items-center justify-between mb-6 shrink-0'>
						<div>
							<h1 className='text-md md:text-3xl font-bold text-gray-900'>Мої записи</h1>
							<p className='text-xs md:text-lg text-gray-600'>
								Керуйте консультаціями з пацієнтами
							</p>
						</div>

						<div className='flex items-center space-x-4 '>
							<Link href='/doctor/profile'>
								<Button>
									<Calendar className='w-4 h-4 mr-2 ' />
									Оновити доступність
								</Button>
							</Link>
						</div>
					</div>

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

						<TabsContent value='upcoming' className='lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden gap-3'>
							<p className='text-sm text-gray-600 shrink-0'>
								У списку пріоритет, пацієнт і коротка скарга. Пояснення і зміна
								пріоритету відкриваються після натискання на запис.
							</p>
							{loading ? (
								<div className='space-y-2'>
									{[...Array(6)].map((_, i) => (
										<div key={i} className='h-16 bg-white border rounded-lg animate-pulse' />
									))}
								</div>
							) : upcomingAppointments.length > 0 ? (
								<div className='lg:flex-1 lg:min-h-0'>
									<DoctorAppointmentList
										items={upcomingAppointments}
										selectedId={selectedId}
										selected={selected}
										onOpen={openAppointment}
										onCancel={handleMarkCancelled}
										overridePriority={overridePriority}
										onReschedule={handleReschedule}
										detailScrollRef={detailScrollRef}
									/>
								</div>
							) : (
								<EmptyState tab='upcoming' />
							)}
						</TabsContent>
						<TabsContent value='past' className='lg:flex lg:flex-col lg:min-h-0 lg:overflow-hidden'>
							{loading ? (
								<div className='space-y-2'>
									{[...Array(4)].map((_, i) => (
										<div key={i} className='h-16 bg-white border rounded-lg animate-pulse' />
									))}
								</div>
							) : pastAppointments.length > 0 ? (
								<div className='lg:flex-1 lg:min-h-0'>
									<DoctorAppointmentList
										items={pastAppointments}
										selectedId={selectedId}
										selected={selected}
										onOpen={openAppointment}
										onCancel={handleMarkCancelled}
										overridePriority={overridePriority}
										onReschedule={handleReschedule}
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

export default DoctorAppointmentContent
