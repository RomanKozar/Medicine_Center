'use client'
import { DoctorFormData, HospitalInfo } from '@/lib/types'
import { userAuthStore } from '@/store/authStore'
import React, { ChangeEvent, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { useRouter } from 'next/navigation'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import {
	getCategoryLabel,
	getSpecializationLabel,
	healthcareCategoriesList,
	specializations,
} from '@/lib/constant'
import { Input } from '../ui/input'
import { Checkbox } from '../ui/checkbox'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'

const DoctorOnboardingForm = () => {
	const [currentStep, setCurrentStep] = useState<number>(1)
	const [formData, setFormData] = useState<DoctorFormData>({
		specialization: '',
		categories: [],
		qualification: '',
		experience: '',
		fees: '',
		about: '',
		hospitalInfo: {
			name: '',
			address: '',
			city: '',
		},
		availabilityRange: {
			startDate: '',
			endDate: '',
			excludedWeekdays: [],
		},
		dailyTimeRanges: [
			{ start: '09:00', end: '12:00' },
			{ start: '14:00', end: '17:00' },
		],
		slotDurationMinutes: 30,
	})

	const { updateProfile, user, loading } = userAuthStore()
	const router = useRouter()

	const handleCategoryToggle = (category: string): void => {
		setFormData((prev: DoctorFormData) => ({
			...prev,
			categories: prev.categories.includes(category)
				? prev.categories.filter((c: string) => c !== category)
				: [...prev.categories, category],
		}))
	}

	const handleInputChnage = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	): void => {
		const { name, value } = event.target
		setFormData((prev: DoctorFormData) => ({
			...prev,
			[name]: value,
		}))
	}

	const handleHospitalInfoChnage = (
		field: keyof HospitalInfo,
		value: string
	): void => {
		setFormData(prev => ({
			...prev,
			hospitalInfo: {
				...prev.hospitalInfo,
				[field]: value,
			},
		}))
	}

	const handleSubmit = async (): Promise<void> => {
		try {
			await updateProfile({
				specialization: formData.specialization,
				category: formData.categories,
				qualification: formData.qualification,
				experience: formData.experience,
				about: formData.about,
				fees: formData.fees,
				hospitalInfo: formData.hospitalInfo,
				availabilityRange: {
					startDate: new Date(formData.availabilityRange.startDate),
					endDate: new Date(formData.availabilityRange.endDate),
					excludedWeekdays: formData.availabilityRange.excludedWeekdays,
				},
				dailyTimeRanges: formData.dailyTimeRanges,
				slotDurationMinutes: formData.slotDurationMinutes,
			})
			router.push('/doctor/dashboard')
		} catch (error) {
			console.error('Profile update failed', error)
		}
	}
	const handleNext = (): void => {
		if (currentStep < 3) {
			setCurrentStep(currentStep + 1)
		}
	}

	const handlePrevious = (): void => {
		if (currentStep > 1) {
			setCurrentStep(currentStep - 1)
		}
	}
	return (
		<div className='w-full max-w-2xl mx-auto'>
			<Card className='shadow-lg'>
				<CardContent className='p-8'>
					{currentStep === 1 && (
						<div className='space-y-6'>
							<h2 className='text-xl font-semibold mb-4'>
								Професійні дані
							</h2>
							<div className='grid md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='specialization'>Медична спеціалізація</Label>

									<Select
										value={formData.specialization}
										onValueChange={(value: string) =>
											setFormData(prev => ({
												...prev,
												specialization: value,
											}))
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Оберіть спеціалізацію'></SelectValue>
										</SelectTrigger>
										<SelectContent>
											{specializations.map((spec: string) => (
												<SelectItem key={spec} value={spec}>
													{getSpecializationLabel(spec)}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='experience'>Років досвіду</Label>
									<Input
										id='experience'
										name='experience'
										type='number'
										value={formData.experience}
										placeholder='напр., 5'
										onChange={handleInputChnage}
										required
									/>
								</div>
							</div>

							<div className='space-y-3'>
								<Label>Категорії медичної допомоги</Label>
								<p className='text-sm text-gray-600'>
									Оберіть напрямки, у яких ви надаєте послуги (мінімум одну)
								</p>

								<div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
									{healthcareCategoriesList.map((category: string) => (
										<div className='flex items-center space-x-2' key={category}>
											<Checkbox
												id={category}
												checked={formData.categories.includes(category)}
												onCheckedChange={() => handleCategoryToggle(category)}
											/>
											<label
												htmlFor={category}
												className='text-sm font-medium cursor-pointer hover:text-blue-600'
											>
												{getCategoryLabel(category)}
											</label>
										</div>
									))}
								</div>
								{formData.categories.length === 0 && (
									<p className='text-red-500 text-xs'>
										Оберіть принаймні одну категорію
									</p>
								)}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='qualification'>Кваліфікація</Label>
								<Input
									id='qualification'
									name='qualification'
									type='text'
									value={formData.qualification}
									placeholder='напр., диплом лікаря, спеціалізація'
									onChange={handleInputChnage}
									required
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='about'>Про себе</Label>
								<Input
									id='about'
									name='about'
									type='text'
									value={formData.about}
									placeholder='Розкажіть пацієнтам про ваш досвід і підхід до лікування...'
									onChange={handleInputChnage}
									required
								/>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='fees'>Вартість консультації ($)</Label>
								<Input
									id='fees'
									name='fees'
									type='number'
									value={formData.fees}
									placeholder='e.g., 500'
									onChange={handleInputChnage}
									required
								/>
							</div>
						</div>
					)}

					{currentStep === 2 && (
						<div className='space-y-6'>
							<h2 className='text-xl font-semibold mb-4'>
								Дані лікарні / клініки
							</h2>

							<div className='grid md:grid-cols-2 gap-6'>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='hospitalName'>Назва лікарні / клініки</Label>
									<Input
										id='hospitalName'
										type='text'
										value={formData.hospitalInfo.name}
										placeholder='напр., Київська міська лікарня'
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											handleHospitalInfoChnage('name', e.target.value)
										}
										required
									/>
								</div>

								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='address'>Адреса</Label>
									<Textarea
										id='address'
										value={formData.hospitalInfo.address}
										placeholder='Повна адреса прийому'
										onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
											handleHospitalInfoChnage('address', e.target.value)
										}
										rows={3}
										required
									/>
								</div>

								<div className='space-y-2 '>
									<Label htmlFor='city'>Місто</Label>
									<Input
										id='city'
										type='text'
										value={formData.hospitalInfo.city}
										placeholder='напр., Київ'
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											handleHospitalInfoChnage('city', e.target.value)
										}
										required
									/>
								</div>
							</div>
						</div>
					)}

					{currentStep === 3 && (
						<div className='space-y-6'>
							<h2 className='text-xl font-semibold mb-4'>
								Налаштування доступності
							</h2>
							<div className='grid md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='startDate'>Доступний із</Label>
									<Input
										id='startDate'
										type='date'
										value={formData.availabilityRange.startDate}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setFormData(prev => ({
												...prev,
												availabilityRange: {
													...prev.availabilityRange,
													startDate: e.target.value,
												},
											}))
										}}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='endDate'>Доступний до</Label>
									<Input
										id='endDate'
										type='date'
										value={formData.availabilityRange.endDate}
										onChange={(e: ChangeEvent<HTMLInputElement>) => {
											setFormData(prev => ({
												...prev,
												availabilityRange: {
													...prev.availabilityRange,
													endDate: e.target.value,
												},
											}))
										}}
										required
									/>
								</div>
							</div>

							<div className='space-y-2'>
								<Label>Тривалість слота прийому</Label>
								<Select
									value={formData.slotDurationMinutes?.toString() || '30'}
									onValueChange={(value: string) =>
										setFormData(prev => ({
											...prev,
											slotDurationMinutes: parseInt(value),
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder='Оберіть тривалість'></SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value='15'>15 хв</SelectItem>
										<SelectItem value='20'>20 хв</SelectItem>
										<SelectItem value='30'>30 хв</SelectItem>
										<SelectItem value='45'>45 хв</SelectItem>
										<SelectItem value='60'>60 хв</SelectItem>
										<SelectItem value='90'>90 хв</SelectItem>
										<SelectItem value='120'>120 хв</SelectItem>
									</SelectContent>
								</Select>
								<p className='text-sm text-gray-600'>
									Тривалість одного слота консультації
								</p>
							</div>
							<div className='space-y-3'>
								<Label>Робочі дні</Label>
								<p className='text-sm text-gray-600'>
									Позначте дні, коли ви недоступні
								</p>

								<div className='grid grid-cols-4 md:grid-cols-7 gap-2'>
									{[
										{ day: 'Нд', value: 0 },
										{ day: 'Пн', value: 1 },
										{ day: 'Вт', value: 2 },
										{ day: 'Ср', value: 3 },
										{ day: 'Чт', value: 4 },
										{ day: 'Пт', value: 5 },
										{ day: 'Сб', value: 6 },
									].map(({ day, value }) => (
										<div key={value} className='flex items-center space-x-2'>
											<Checkbox
												id={`day-${value}`}
												checked={formData.availabilityRange.excludedWeekdays.includes(
													value
												)}
												onCheckedChange={checked => {
													if (checked) {
														setFormData(prev => ({
															...prev,
															availabilityRange: {
																...prev.availabilityRange,
																excludedWeekdays: [
																	...prev.availabilityRange.excludedWeekdays,
																	value,
																],
															},
														}))
													} else {
														setFormData(prev => ({
															...prev,
															availabilityRange: {
																...prev.availabilityRange,
																excludedWeekdays:
																	prev.availabilityRange.excludedWeekdays.filter(
																		d => d !== value
																	),
															},
														}))
													}
												}}
											/>
											<label
												htmlFor={`day-${value}`}
												className='text-sm font-medium cursor-pointer'
											>
												{day}
											</label>
										</div>
									))}
								</div>
							</div>
							<div className='space-y-4'>
								<Label>Щоденний графік</Label>
								<p className='text-sm text-gray-600'>
									Вкажіть години роботи на кожен день
								</p>

								{formData.dailyTimeRanges.map((range, index) => (
									<div
										key={index}
										className='flex items-center space-x-4 p-4 border rounded-lg'
									>
										<div className='flex-1'>
											<Label className='text-sm'>
												Сеанс {index + 1} - початок
											</Label>
											<Input
												type='time'
												value={range.start}
												onChange={(e: ChangeEvent<HTMLInputElement>) => {
													const newRange = [...formData.dailyTimeRanges]
													newRange[index].start = e.target.value
													setFormData(prev => ({
														...prev,
														dailyTimeRanges: newRange,
													}))
												}}
												required
											/>
										</div>

										<div className='flex-1'>
											<Label className='text-sm'>
												Сеанс {index + 1} - кінець
											</Label>
											<Input
												type='time'
												value={range.end}
												onChange={(e: ChangeEvent<HTMLInputElement>) => {
													const newRange = [...formData.dailyTimeRanges]
													newRange[index].end = e.target.value
													setFormData(prev => ({
														...prev,
														dailyTimeRanges: newRange,
													}))
												}}
												required
											/>
										</div>

										{formData.dailyTimeRanges.length > 1 && (
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() => {
													const newRange = formData.dailyTimeRanges.filter(
														(_, i) => i !== index
													)
													setFormData(prev => ({
														...prev,
														dailyTimeRanges: newRange,
													}))
												}}
												className='text-red-600 hover:text-red-700'
											>
												Видалити
											</Button>
										)}
									</div>
								))}

								<Button
									type='button'
									variant='outline'
									size='sm'
									onClick={() => {
										setFormData(prev => ({
											...prev,
											dailyTimeRanges: [
												...prev.dailyTimeRanges,
												{ start: '18:00', end: '20:00' },
											],
										}))
									}}
									className='w-full'
								>
									+ Додати ще один інтервал
								</Button>
							</div>
						</div>
					)}
					<div className='flex justify-between pt-8'>
						<Button
							type='button'
							variant='outline'
							onClick={handlePrevious}
							disabled={currentStep === 1}
						>
							Назад
						</Button>

						{currentStep < 3 ? (
							<Button
								type='button'
								onClick={handleNext}
								disabled={currentStep === 1 && formData.categories.length === 0}
							>
								Далі
							</Button>
						) : (
							<Button
								type='button'
								onClick={handleSubmit}
								disabled={loading}
								className='bg-green-600 hover:bg-green-700'
							>
								{loading ? 'Завершення...' : 'Завершити профіль'}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default DoctorOnboardingForm
