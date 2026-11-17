'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { postWithoutAuth } from '@/service/httpService'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import React, { Suspense, useState } from 'react'

const ResetPasswordForm = () => {
	const params = useSearchParams()
	const router = useRouter()
	const token = params.get('token') || ''
	const type = params.get('type') === 'doctor' ? 'doctor' : 'patient'
	const [password, setPassword] = useState('')
	const [error, setError] = useState('')
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault()
		if (loading) return
		setLoading(true)
		setError('')
		try {
			await postWithoutAuth('auth/reset-password', { token, type, password })
			router.push(`/login/${type}`)
		} catch (err: any) {
			setError(err.message || 'Не вдалося змінити пароль')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className='min-h-screen bg-gray-50 flex items-center justify-center px-4'>
			<Card className='w-full max-w-md border-0 shadow-xl'>
				<CardContent className='p-8'>
					<h1 className='text-2xl font-bold text-gray-900 mb-6'>Новий пароль</h1>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='password'>Пароль</Label>
							<Input
								id='password'
								type='password'
								minLength={6}
								value={password}
								onChange={event => setPassword(event.target.value)}
								required
							/>
						</div>
						{error && <p className='text-sm text-red-600'>{error}</p>}
						<Button type='submit' className='w-full' disabled={loading || !token}>
							{loading ? 'Збереження...' : 'Зберегти пароль'}
						</Button>
					</form>
					<div className='mt-4 text-center'>
						<Link href={`/login/${type}`} className='text-sm text-blue-600'>
							До входу
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default function ResetPasswordPage() {
	return (
		<Suspense>
			<ResetPasswordForm />
		</Suspense>
	)
}
