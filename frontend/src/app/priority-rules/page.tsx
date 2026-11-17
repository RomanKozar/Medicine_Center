'use client'

import Header from '@/components/landing/Header'
import Footer from '@/components/landing/Footer'
import { getWithoutAuth } from '@/service/httpService'
import { getPriorityColor } from '@/lib/constant'
import { Badge } from '@/components/ui/badge'
import { userAuthStore } from '@/store/authStore'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'

interface RulesPayload {
	disclaimer: string
	emergencyNotice: string
	levels: { id: string; min: number; label: string }[]
	severity: { text: string }
	age: { text: string }
	chronic: { text: string }
	acute: { text: string }
	prolonged: { text: string }
	complaints: { id: string; label: string; points: number }[]
	redFlags: {
		id: string
		label: string
		points: number
		forcesEmergency: boolean
		complaintLabels?: string[]
	}[]
	specialties: { label: string; note: string }[]
	comparisons: {
		title: string
		result: {
			score: number
			level: string
			levelLabel: string
			reasons: string[]
		}
	}[]
}

const PriorityRulesPage = () => {
	const { isAuthenticated } = userAuthStore()
	const [rules, setRules] = useState<RulesPayload | null>(null)
	const [error, setError] = useState('')

	useEffect(() => {
		getWithoutAuth('appointment/rules')
			.then(response => setRules(response.data))
			.catch(() => setError('Не вдалося завантажити правила. Перевірте, чи запущений бекенд.'))
	}, [])

	return (
		<div className='min-h-screen bg-gray-50'>
			<Header showDashboardNav={isAuthenticated} />
			<main className='pt-24 pb-16'>
				<div className='container mx-auto px-4 max-w-5xl space-y-8'>
					<div>
						<h1 className='text-3xl font-bold text-gray-900'>
							Як рахується пріоритет
						</h1>
						<p className='mt-3 text-gray-600'>
							Бали складаються з прозорих правил. Рівень звернення від цього не
							змінює лікарська спеціалізація: вона лише впорядковує звернення
							всередині одного рівня.
						</p>
					</div>

					{error && <p className='text-red-600'>{error}</p>}

					{rules && (
						<>
							<div className='rounded-lg border border-red-200 bg-red-50 p-4 text-red-800'>
								{rules.emergencyNotice}
							</div>
							<p className='text-sm text-gray-600'>{rules.disclaimer}</p>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-4'>Рівні</h2>
								<div className='grid grid-cols-2 md:grid-cols-4 gap-3'>
									{rules.levels.map(level => (
										<div key={level.id} className='rounded-lg border p-3'>
											<Badge className={getPriorityColor(level.id)}>
												{level.label}
											</Badge>
											<p className='mt-2 text-sm text-gray-600'>
												від {level.min} балів
											</p>
										</div>
									))}
								</div>
							</section>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-4'>Що додає бали</h2>
								<ul className='space-y-2 text-gray-700'>
									<li>{rules.severity.text}</li>
									<li>{rules.age.text}</li>
									<li>{rules.chronic.text}</li>
									<li>{rules.acute.text}</li>
									<li>{rules.prolonged.text}</li>
								</ul>
							</section>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-4'>Категорії скарг</h2>
								<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
									{rules.complaints.map(item => (
										<div
											key={item.id}
											className='flex justify-between border rounded-md px-3 py-2'
										>
											<span>{item.label}</span>
											<span className='font-semibold'>+{item.points}</span>
										</div>
									))}
								</div>
							</section>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-4'>Червоні ознаки</h2>
								<div className='space-y-2'>
									{rules.redFlags.map(item => (
										<div
											key={item.id}
											className='flex justify-between gap-4 border rounded-md px-3 py-2'
										>
											<div>
												<p>{item.label}</p>
												{item.complaintLabels && item.complaintLabels.length > 0 && (
													<p className='text-xs text-gray-500 mt-1'>
														Для скарг: {item.complaintLabels.join(', ')}
													</p>
												)}
											</div>
											<span className='font-semibold whitespace-nowrap'>
												+{item.points}
												{item.forcesEmergency ? ' · невідкладно' : ''}
											</span>
										</div>
									))}
								</div>
							</section>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-2'>
									Однакове звернення, різні пацієнти
								</h2>
								<p className='text-sm text-gray-600 mb-4'>
									Скарга одна: біль у грудях, сила 8/10, триває до 6 годин.
									Змінюються лише вік і червона ознака.
								</p>
								<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
									{rules.comparisons.map(item => (
										<div key={item.title} className='border rounded-lg p-4'>
											<p className='font-medium'>{item.title}</p>
											<Badge className={`mt-3 ${getPriorityColor(item.result.level)}`}>
												{item.result.levelLabel} · {item.result.score}
											</Badge>
											<ul className='mt-3 space-y-1 text-xs text-gray-600'>
												{item.result.reasons.map(reason => (
													<li key={reason}>• {reason}</li>
												))}
											</ul>
										</div>
									))}
								</div>
							</section>

							<section className='bg-white rounded-xl border p-6'>
								<h2 className='text-xl font-semibold mb-4'>
									Спеціалізація лікаря
								</h2>
								<p className='text-sm text-gray-600 mb-4'>
									Загальний рівень лишається тим самим. Усередині рівня
									звернення, ближче до спеціалізації лікаря, стоїть вище.
								</p>
								<ul className='space-y-2 text-gray-700'>
									{rules.specialties.map(item => (
										<li key={item.label}>
											<span className='font-medium'>{item.label}.</span>{' '}
											{item.note}
										</li>
									))}
								</ul>
							</section>

							<Link href='/doctor-list' className='inline-block text-blue-700'>
								До списку лікарів
							</Link>
						</>
					)}
				</div>
			</main>
			<Footer />
		</div>
	)
}

export default PriorityRulesPage
