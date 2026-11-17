'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { postWithoutAuth } from '@/service/httpService'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, useState } from 'react'

const ForgotPasswordForm = () => {
	const params = useSearchParams()
	const initialType = params.get('type') === 'doctor' ? 'doctor' : 'patient'
	const [type, setType] = useState<'doctor' | 'patient'>(initialType)
	const [email, setEmail] = useState('')
	const [message, setMessage] = useState('')
	const [demoLink, setDemoLink] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (loading) return
		setLoading(true)
		setError('')
		setMessage('')
		setDemoLink('')
		try {
			const response = await postWithoutAuth('auth/forgot-password', {
				email,
				type,
			})
			setMessage(response.message)
			if (response.data?.demoLink) setDemoLink(response.data.demoLink)
		} catch (err: any) {
			setError(err.message || 'Не вдалося надіслати інструкцію')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
			<Card className='w-full max-w-md border-0 shadow-xl'>
				<CardContent className='p-8'>
					<h1 className='text-2xl font-bold text-gray-900 mb-2'>
						Відновлення пароля
					</h1>
					<p className='text-sm text-gray-600 mb-6'>
						Надішлемо посилання для нового пароля. Воно діє одну годину.
					</p>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='flex gap-2'>
							<Button
								type='button'
								variant={type === 'patient' ? 'default' : 'outline'}
								onClick={() => setType('patient')}
							>
								Пацієнт
							</Button>
							<Button
								type='button'
								variant={type === 'doctor' ? 'default' : 'outline'}
								onClick={() => setType('doctor')}
							>
								Лікар
							</Button>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={event => setEmail(event.target.value)}
								required
							/>
						</div>
						{error && <p className='text-sm text-red-600'>{error}</p>}
						{message && <p className='text-sm text-gray-700'>{message}</p>}
						{demoLink && (
							<a href={demoLink} className='block text-sm text-blue-700 break-all'>
								{demoLink}
							</a>
						)}
						<Button type='submit' className='w-full' disabled={loading}>
							{loading ? 'Надсилання...' : 'Надіслати посилання'}
						</Button>
					</form>
					<div className='mt-4 text-center'>
						<Link href={`/login/${type}`} className='text-sm text-blue-600'>
							Повернутися до входу
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function ForgotPasswordPage() {
	return (
		<Suspense>
			<ForgotPasswordForm />
		</Suspense>
	)
}
