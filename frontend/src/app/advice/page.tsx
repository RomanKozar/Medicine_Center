'use client'

import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { postWithoutAuth } from '@/service/httpService'
import { userAuthStore } from '@/store/authStore'
import { complaintOptions, redFlagsForComplaint } from '@/lib/triage'
import { getPriorityColor, getSpecializationLabel } from '@/lib/constant'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useState } from 'react'

interface AdviceDoctor {
	_id: string
	name: string
	specialization: string
	fees?: number
	hospitalInfo?: { name?: string; city?: string }
}

interface AdviceResult {
	complaintLabel: string
	guessed: boolean
	where: { title: string; text: string }
	priority: {
		level: string
		levelLabel: string
		score: number
		emergencyNotice: string
		disclaimer: string
	}
	specialties: { specialization: string; label: string }[]
	doctors: AdviceDoctor[]
}

const AdvicePage = () => {
	const router = useRouter()
	const { user } = userAuthStore()
	const [text, setText] = useState('')
	const [complaint, setComplaint] = useState('')
	const [redFlags, setRedFlags] = useState<string[]>([])
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState('')
	const [result, setResult] = useState<AdviceResult | null>(null)

	const submit = async (event: React.FormEvent) => {
		event.preventDefault()
		setError('')
		setLoading(true)
		try {
			const response = await postWithoutAuth('appointment/recommend', {
				text,
				complaint,
				redFlags,
			})
			setResult(response.data)
		} catch (err: any) {
			setResult(null)
			setError(
				err?.message ||
					'Не вдалося підібрати лікаря. Перевірте, чи запущений сервер.'
			)
		} finally {
			setLoading(false)
		}
	}

	const book = (doctor: AdviceDoctor) => {
		sessionStorage.setItem('healonline-advice-doctor', doctor._id)
		sessionStorage.setItem('healonline-advice-name', doctor.name)
		if (user?.type === 'patient') {
			router.push(`/patient/booking/${doctor._id}`)
			return
		}
		router.push('/signup/patient')
	}

	const chooseComplaint = (id: string) => {
		const next = complaint === id ? '' : id
		setComplaint(next)
		const allowed = new Set(redFlagsForComplaint(next).map(flag => flag.id))
		setRedFlags(current => current.filter(flag => allowed.has(flag)))
	}

	const toggleFlag = (id: string) => {
		setRedFlags(current =>
			current.includes(id) ? current.filter(flag => flag !== id) : [...current, id]
		)
	}

	const signs = redFlagsForComplaint(complaint)

	return (
		<div className='min-h-screen bg-gray-50'>
			<Header showDashboardNav={Boolean(user)} />
			<main className='pt-24 pb-16'>
				<div className='container mx-auto px-4 max-w-3xl space-y-6'>
					<div>
						<h1 className='text-3xl font-bold text-gray-900'>Куди звернутися</h1>
						<p className='mt-3 text-gray-600'>
							Натисніть, що турбує, і за бажанням допишіть своїми словами. Система
							підкаже профіль лікаря і запропонує, до кого записатися. Особисті
							дані потрібні лише для реєстрації перед записом.
						</p>
					</div>

					<form onSubmit={submit} className='bg-white rounded-xl border p-6 space-y-5'>
						<div>
							<p className='text-sm font-medium text-gray-800'>Що турбує</p>
							<div className='mt-3 flex flex-wrap gap-2'>
								{complaintOptions.map(option => {
									const selected = complaint === option.id
									return (
										<button
											key={option.id}
											type='button'
											onClick={() => chooseComplaint(option.id)}
											className={`rounded-full border px-3 py-1.5 text-sm ${
												selected
													? 'border-blue-600 bg-blue-600 text-white'
													: 'border-gray-300 bg-white text-gray-800 hover:border-blue-400'
											}`}
										>
											{option.label}
										</button>
									)
								})}
							</div>
						</div>
						{signs.length > 0 && (
							<div>
								<p className='text-sm font-medium text-gray-800'>
									Додаткові ознаки
								</p>
								<div className='mt-3 flex flex-wrap gap-2'>
									{signs.map(flag => {
										const selected = redFlags.includes(flag.id)
										return (
											<button
												key={flag.id}
												type='button'
												onClick={() => toggleFlag(flag.id)}
												className={`rounded-full border px-3 py-1.5 text-sm text-left ${
													selected
														? 'border-amber-600 bg-amber-50 text-amber-950'
														: 'border-gray-300 bg-white text-gray-800 hover:border-amber-400'
												}`}
											>
												{flag.label}
											</button>
										)
									})}
								</div>
							</div>
						)}
						<label className='block text-sm font-medium text-gray-800'>
							Додатково своїми словами
							<Textarea
								value={text}
								onChange={event => setText(event.target.value)}
								placeholder='Наприклад: другий день болить горло і є температура'
								className='mt-2 min-h-24'
							/>
						</label>
						<Button type='submit' disabled={loading || (!text.trim() && !complaint)}>
							{loading ? 'Підбираємо…' : 'Підказати лікаря'}
						</Button>
						{error && <p className='text-sm text-red-600'>{error}</p>}
					</form>

					{result && (
						<div className='space-y-4'>
							{result.priority.level === 'emergency' && (
								<div className='rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800'>
									{result.priority.emergencyNotice}
								</div>
							)}
							<div className='bg-white rounded-xl border p-6 space-y-3'>
								<div className='flex flex-wrap items-center gap-2'>
									<h2 className='text-xl font-semibold text-gray-900'>
										{result.where.title}
									</h2>
									<Badge className={getPriorityColor(result.priority.level)}>
										{result.priority.levelLabel}
									</Badge>
								</div>
								<p className='text-gray-700'>{result.where.text}</p>
								<p className='text-sm text-gray-500'>
									Скарга: {result.complaintLabel}
									{result.guessed ? ' (за текстом)' : ''}
								</p>
								<p className='text-sm text-gray-600'>
									Профілі:{' '}
									{result.specialties.map(item => item.label).join(', ')}
								</p>
								<p className='text-xs text-gray-500'>{result.priority.disclaimer}</p>
							</div>

							<div className='space-y-3'>
								{result.doctors.map(doctor => (
									<div
										key={doctor._id}
										className='bg-white rounded-xl border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'
									>
										<div>
											<p className='font-semibold text-gray-900'>{doctor.name}</p>
											<p className='text-sm text-gray-600'>
												{getSpecializationLabel(doctor.specialization)}
												{doctor.hospitalInfo?.city
													? ` · ${doctor.hospitalInfo.city}`
													: ''}
												{typeof doctor.fees === 'number' ? ` · ${doctor.fees} грн` : ''}
											</p>
										</div>
										<Button onClick={() => book(doctor)}>
											{user?.type === 'patient'
												? 'Записатися'
												: 'Зареєструватися і записатися'}
										</Button>
									</div>
								))}
								{result.doctors.length === 0 && (
									<p className='text-sm text-gray-600'>
										Зараз немає вільних лікарів цього профілю.{' '}
										<Link href='/doctor-list' className='text-blue-700 underline'>
											Переглянути всіх лікарів
										</Link>
									</p>
								)}
							</div>
						</div>
					)}
				</div>
			</main>
			<Footer />
		</div>
	)
}

export default AdvicePage
