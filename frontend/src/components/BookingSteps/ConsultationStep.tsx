import { consultationTypes, getConsultationTypeLabel } from '@/lib/constant'
import {
	complaintOptions,
	durationOptions,
	PriorityResult,
	redFlagsForComplaint,
	TriageInput,
} from '@/lib/triage'
import { postWithAuth } from '@/service/httpService'
import React, { useEffect, useRef, useState } from 'react'
import { Label } from '../ui/label'
import { Badge } from '../ui/badge'
import { Textarea } from '../ui/textarea'
import { Button } from '../ui/button'
import { Checkbox } from '../ui/checkbox'
import PriorityNote from '../triage/PriorityNote'
import EmergencyBanner from '../triage/EmergencyBanner'

interface ConsultationStepInterface {
	consultationType: string
	setConsultationType: (type: string) => void
	symptoms: string
	setSymptoms: (symptoms: string) => void
	triage: TriageInput
	setTriage: (triage: TriageInput) => void
	doctorFees: number
	onBack: () => void
	onContinue: () => void
}
const ConsultationStep = ({
	consultationType,
	setConsultationType,
	symptoms,
	setSymptoms,
	triage,
	setTriage,
	doctorFees,
	onBack,
	onContinue,
}: ConsultationStepInterface) => {
	const [priority, setPriority] = useState<PriorityResult | null>(null)
	const priorityRequest = useRef(0)

	useEffect(() => {
		if (!triage.complaint) {
			setPriority(null)
			return
		}

		const requestId = ++priorityRequest.current
		const timer = setTimeout(async () => {
			try {
				const response = await postWithAuth('appointment/preview-priority', {
					triage,
				})
				if (requestId === priorityRequest.current) {
					setPriority(response.data)
				}
			} catch (error) {
				if (requestId === priorityRequest.current) {
					console.error('Priority preview failed', error)
				}
			}
		}, 800)

		return () => clearTimeout(timer)
	}, [triage])
	const getConsultationPrice = (selectedType = consultationType) => {
		const typePrice =
			consultationTypes.find(ct => ct.type === selectedType)?.price || 0
		return Math.max(0, doctorFees + typePrice)
	}

	const handleTypeChnage = (newType: string) => {
		setConsultationType(newType)
	}
	return (
		<div className='space-y-8'>
			<div>
				<h3 className='text-2xl font-bold text-gray-900 mb-6'>
					Деталі консультації
				</h3>
				<div className='mb-8'>
					<Label className='text-base font-semibold mb-4 block'>
						Оберіть тип консультації
					</Label>
					<div className='space-y-3'>
						{consultationTypes.map(
							({ type, icon: Icon, description, price, recommended }) => {
								const currentPrice = getConsultationPrice(type)
								const isSelected = consultationType === type
								return (
									<div
										key={type}
										className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all ${
											isSelected
												? 'border-blue-500 bg-blue-50'
												: 'border-gray-200 hover:border-gray-300'
										}`}
										onClick={() => handleTypeChnage(type)}
									>
										{recommended && (
											<Badge className='absolute -top-2 left-4 bg-green-500'>
												Рекомендовано
											</Badge>
										)}
										<div className='flex items-center space-x-4'>
											<div
												className={`w-12 h-12 rounded-lg flex items-center justify-center ${
													isSelected ? 'bg-blue-100' : 'bg-gray-100'
												}`}
											>
												<Icon
													className={`w-6 h-6 ${
														isSelected ? 'text-blue-600' : 'text-gray-600'
													}`}
												/>
											</div>
											<div className='flex-1'>
												<h4 className='font-semibold text-gray-900'>
													{getConsultationTypeLabel(type)}
												</h4>
												<p className='text-sm text-gray-600'>{description}</p>
											</div>
											<div className='text-right'>
												<p className='font-semibold text-gray-900'>
													${currentPrice}
												</p>
												{price !== 0 && (
													<p className='text-sm text-green-600'>
														Економія ${Math.abs(price)}
													</p>
												)}
											</div>
										</div>
									</div>
								)
							}
						)}
					</div>
				</div>

				<div className='mb-8 p-4 bg-blue-50 rounded-lg'>
					<div className='flex justify-between items-center'>
						<span className='font-semibold text-blue-900'>
							Обрана консультація:
						</span>
						<span className='text-lg font-bold text-blue-900'>
							{getConsultationTypeLabel(consultationType)} - $
							{getConsultationPrice()}
						</span>
					</div>
				</div>

				<div className='mb-8 space-y-4'>
					<div>
						<Label className='text-base font-semibold mb-2 block'>
							Категорія скарги *
						</Label>
						<select
							value={triage.complaint}
							onChange={e => {
								const complaint = e.target.value
								const allowed = new Set(
									redFlagsForComplaint(complaint).map(flag => flag.id)
								)
								setTriage({
									...triage,
									complaint,
									redFlags: triage.redFlags.filter(id => allowed.has(id)),
								})
							}}
							className='w-full border-2 rounded-md px-3 py-2 bg-white'
						>
							<option value=''>Оберіть категорію</option>
							{complaintOptions.map(option => (
								<option key={option.id} value={option.id}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label className='text-base font-semibold mb-2 block'>
							Наскільки сильно турбує: {triage.severity}/10
						</Label>
						<input
							type='range'
							min={1}
							max={10}
							value={triage.severity}
							onChange={e =>
								setTriage({ ...triage, severity: Number(e.target.value) })
							}
							className='w-full'
						/>
					</div>

					<div>
						<Label className='text-base font-semibold mb-2 block'>
							Як давно це триває
						</Label>
						<select
							value={triage.durationHours}
							onChange={e =>
								setTriage({
									...triage,
									durationHours: Number(e.target.value),
								})
							}
							className='w-full border-2 rounded-md px-3 py-2 bg-white'
						>
							{durationOptions.map(option => (
								<option key={option.hours} value={option.hours}>
									{option.label}
								</option>
							))}
						</select>
					</div>

					<div>
						<Label className='text-base font-semibold mb-2 block'>
							Тривожні ознаки
						</Label>
						{!triage.complaint ? (
							<p className='text-sm text-gray-500'>
								Спочатку оберіть категорію скарги. Ознаки з’являться лише ті, що до неї пасують.
							</p>
						) : (
						<div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
							{redFlagsForComplaint(triage.complaint).map(flag => {
								const checked = triage.redFlags.includes(flag.id)
								return (
									<label
										key={flag.id}
										className='flex items-start gap-2 text-sm text-gray-700'
									>
										<Checkbox
											checked={checked}
											onCheckedChange={value => {
												const redFlags = value
													? [...triage.redFlags, flag.id]
													: triage.redFlags.filter(id => id !== flag.id)
												setTriage({ ...triage, redFlags })
											}}
										/>
										<span>{flag.label}</span>
									</label>
								)
							})}
						</div>
						)}
					</div>

					<label className='flex items-center gap-2 text-sm text-gray-700'>
						<Checkbox
							checked={triage.hasChronicCondition}
							onCheckedChange={value =>
								setTriage({
									...triage,
									hasChronicCondition: Boolean(value),
								})
							}
						/>
						Є хронічне захворювання
					</label>

					{priority && (
						<div className='rounded-lg border border-blue-100 bg-blue-50 p-4'>
							<p className='font-semibold text-blue-900 mb-2'>
								Попередній пріоритет черги
							</p>
							<PriorityNote priority={priority} />
							{priority.level === 'emergency' && (
								<div className='mt-3'>
									<EmergencyBanner audience='patient' />
								</div>
							)}
						</div>
					)}
				</div>

				<div className='mb-8'>
					<Label
						htmlFor='symptoms'
						className='text-base font-semibold mb-4 block'
					>
						Опишіть симптоми або занепокоєння *
					</Label>
					<Textarea
						id='symptoms'
						placeholder='Опишіть, з чим звертаєтесь до лікаря сьогодні...'
						value={symptoms}
						onChange={e => setSymptoms(e.target.value)}
						rows={5}
						className='resize-none border-2 focus:border-blue-500'
					/>
				</div>
			</div>

			<div className='flex justify-between gap-2'>
				<Button variant='outline' onClick={onBack} className='PX-8 PY-3'>
					Назад
				</Button>
				<Button
					onClick={onContinue}
					disabled={!symptoms.trim() || !triage.complaint}
					className='px-7 py-3 bg-blue-600 hover:bg-blue-700'
				>
					Перейти до оплати
				</Button>
			</div>
		</div>
	)
}

export default ConsultationStep
