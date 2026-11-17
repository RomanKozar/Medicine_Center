'use client'

import Header from '@/components/landing/Header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getWithAuth, postWithAuth } from '@/service/httpService'
import { userAuthStore } from '@/store/authStore'
import { Eye, EyeOff, KeyRound, RefreshCw, User } from 'lucide-react'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

type Captcha = { id: string; code: string }

const SettingsPage = () => {
	const { user } = userAuthStore()
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [showCurrent, setShowCurrent] = useState(false)
	const [captcha, setCaptcha] = useState<Captcha | null>(null)
	const [captchaAnswer, setCaptchaAnswer] = useState('')
	const [revealedPassword, setRevealedPassword] = useState('')
	const [revealNote, setRevealNote] = useState('')
	const [message, setMessage] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const profileHref = user?.type === 'doctor' ? '/doctor/profile' : '/patient/profile'
	const homeHref = user?.type === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard'

	const loadCaptcha = async () => {
		const response = await getWithAuth<Captcha>('auth/test-captcha')
		setCaptcha(response.data)
		setCaptchaAnswer('')
	}

	useEffect(() => {
		if (!user) return
		loadCaptcha().catch(() => setError('Не вдалося завантажити тестову перевірку'))
	}, [user])

	const handleReveal = async () => {
		if (loading) return
		setMessage('')
		setError('')
		setRevealNote('')
		setRevealedPassword('')
		if (!captcha || !captchaAnswer.trim()) {
			setError('Введіть код із тестової перевірки')
			return
		}
		setLoading(true)
		try {
			const response = await postWithAuth('auth/test-password-preview', {
				captchaId: captcha.id,
				captchaAnswer,
			})
			setRevealNote(response.message)
			if (response.data?.visible && response.data.password) {
				setRevealedPassword(response.data.password)
			}
		} catch (err: any) {
			setError(err.message || 'Не вдалося показати пароль')
		} finally {
			setLoading(false)
			loadCaptcha().catch(() => undefined)
		}
	}

	const handlePassword = async (event: React.FormEvent) => {
		event.preventDefault()
		if (loading) return
		setMessage('')
		setError('')
		if (newPassword.length < 6) {
			setError('Новий пароль має містити щонайменше 6 символів')
			return
		}
		if (newPassword !== confirmPassword) {
			setError('Новий пароль і підтвердження не збігаються')
			return
		}
		if (!captcha || !captchaAnswer.trim()) {
			setError('Введіть код із тестової перевірки')
			return
		}
		setLoading(true)
		try {
			const response = await postWithAuth('auth/change-password', {
				currentPassword,
				newPassword,
				captchaId: captcha.id,
				captchaAnswer,
			})
			setMessage(response.message || 'Пароль змінено')
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			setRevealedPassword('')
			setRevealNote('Пароль змінено. Новий уже не показується, бо в базі зберігається лише хеш.')
		} catch (err: any) {
			setError(err.message || 'Не вдалося змінити пароль')
		} finally {
			setLoading(false)
			loadCaptcha().catch(() => undefined)
		}
	}

	if (!user) {
		return (
			<>
				<Header />
				<div className='min-h-screen bg-gray-50 pt-24 px-4 text-center text-gray-600'>
					Щоб відкрити налаштування, потрібно увійти.
				</div>
			</>
		)
	}

	return (
		<>
			<Header showDashboardNav={true} />
			<div className='min-h-screen bg-gray-50 pt-16'>
				<div className='container mx-auto px-4 py-8 max-w-3xl'>
					<h1 className='text-3xl font-bold text-gray-900 mb-2'>Налаштування</h1>
					<p className='text-gray-600 mb-8'>
						Обліковий запис і пароль. Дані профілю змінюються окремо.
					</p>

					<div className='space-y-6'>
						<Card>
							<CardContent className='p-6'>
								<div className='flex items-center gap-2 mb-4'>
									<User className='w-5 h-5 text-blue-600' />
									<h2 className='text-lg font-semibold text-gray-900'>Обліковий запис</h2>
								</div>
								<div className='grid gap-4 sm:grid-cols-2'>
									<div>
										<p className='text-sm text-gray-500'>Імʼя</p>
										<p className='font-medium text-gray-900'>{user.name}</p>
									</div>
									<div>
										<p className='text-sm text-gray-500'>Email</p>
										<p className='font-medium text-gray-900 break-all'>{user.email}</p>
									</div>
								</div>
								<div className='mt-6 flex flex-wrap gap-3'>
									<Link href={profileHref}>
										<Button variant='outline'>Редагувати профіль</Button>
									</Link>
									<Link href={homeHref}>
										<Button variant='ghost'>До записів</Button>
									</Link>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardContent className='p-6'>
								<div className='flex items-center gap-2 mb-2'>
									<KeyRound className='w-5 h-5 text-blue-600' />
									<h2 className='text-lg font-semibold text-gray-900'>Пароль</h2>
								</div>
								<p className='text-sm text-gray-600 mb-4'>
									Перегляд пароля і код нижче працюють лише в тестовому режимі.
									Після зміни пароля система зберігає хеш і більше не може показати текст.
								</p>
								<form onSubmit={handlePassword} className='space-y-4 max-w-md'>
									<div className='space-y-2'>
										<Label htmlFor='currentPassword'>Поточний пароль</Label>
										<div className='relative'>
											<Input
												id='currentPassword'
												type={showCurrent ? 'text' : 'password'}
												value={currentPassword}
												onChange={event => setCurrentPassword(event.target.value)}
												autoComplete='current-password'
												className='pr-10'
												required
											/>
											<Button
												type='button'
												variant='ghost'
												size='sm'
												className='absolute right-0 top-0 h-full px-3 hover:bg-transparent'
												onClick={() => setShowCurrent(value => !value)}
											>
												{showCurrent ? (
													<EyeOff className='h-4 w-4 text-gray-400' />
												) : (
													<Eye className='h-4 w-4 text-gray-400' />
												)}
											</Button>
										</div>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='newPassword'>Новий пароль</Label>
										<Input
											id='newPassword'
											type='password'
											value={newPassword}
											onChange={event => setNewPassword(event.target.value)}
											autoComplete='new-password'
											required
										/>
									</div>
									<div className='space-y-2'>
										<Label htmlFor='confirmPassword'>Підтвердження</Label>
										<Input
											id='confirmPassword'
											type='password'
											value={confirmPassword}
											onChange={event => setConfirmPassword(event.target.value)}
											autoComplete='new-password'
											required
										/>
									</div>

									<div className='rounded-lg border border-dashed border-blue-300 bg-blue-50 p-4 space-y-3'>
										<p className='text-sm font-medium text-blue-900'>Тестова перевірка</p>
										<div className='flex items-center gap-3'>
											<span className='inline-block rounded border bg-white px-3 py-2 font-mono text-xl font-bold tracking-[0.35em] text-slate-800 italic'>
												{captcha?.code || '·····'}
											</span>
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() => loadCaptcha().catch(() => setError('Не вдалося оновити код'))}
											>
												<RefreshCw className='w-4 h-4 mr-2' />
												Новий код
											</Button>
										</div>
										<div className='space-y-2'>
											<Label htmlFor='captchaAnswer'>Введіть код</Label>
											<Input
												id='captchaAnswer'
												value={captchaAnswer}
												onChange={event => setCaptchaAnswer(event.target.value)}
												autoComplete='off'
											/>
										</div>
									</div>

									{error && <p className='text-sm text-red-600'>{error}</p>}
									{message && <p className='text-sm text-green-700'>{message}</p>}
									{revealNote && <p className='text-sm text-gray-700'>{revealNote}</p>}
									{revealedPassword && (
										<p className='rounded-md border bg-amber-50 px-3 py-2 text-sm text-amber-950'>
											Поточний тестовий пароль:{' '}
											<span className='font-mono font-semibold'>{revealedPassword}</span>
										</p>
									)}

									<div className='flex flex-wrap gap-3'>
										<Button type='button' variant='outline' onClick={handleReveal} disabled={loading}>
											Показати поточний пароль
										</Button>
										<Button type='submit' disabled={loading}>
											{loading ? 'Збереження...' : 'Змінити пароль'}
										</Button>
									</div>
								</form>
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</>
	)
}

export default SettingsPage
