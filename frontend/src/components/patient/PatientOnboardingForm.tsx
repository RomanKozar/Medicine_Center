'use client'
import { userAuthStore } from '@/store/authStore'
import { Phone, User } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { ChangeEvent, useState } from 'react'
import { Card, CardContent } from '../ui/card'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Button } from '../ui/button'
import { Alert, AlertDescription } from '../ui/alert'
import { Textarea } from '../ui/textarea'

interface EmerfencyContact {
	name: string
	phone: string
	relationship: string
}
interface MedicalHistory {
	allergies: string
	currentMedications: string
	chronicConditions: string
}

interface PatientOnboardingData {
	phone: string
	dob: string
	gender: string
	bloodGroup?: string
	emergencyContact: EmerfencyContact
	medicalHistory: MedicalHistory
}
const PatientOnboardingForm = () => {
	const [currentStep, setCurrentStep] = useState<number>(1)
	const [formData, setFormData] = useState<PatientOnboardingData>({
		phone: '',
		dob: '',
		gender: '',
		bloodGroup: '',
		emergencyContact: {
			name: '',
			phone: '',
			relationship: '',
		},
		medicalHistory: {
			allergies: '',
			currentMedications: '',
			chronicConditions: '',
		},
	})

	const { updateProfile, user, loading } = userAuthStore()
	const router = useRouter()

	const handleInputChnage = (
		event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	): void => {
		const { name, value } = event.target
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleSelectChange = (name: string, value: string): void => {
		setFormData(prev => ({ ...prev, [name]: value }))
	}

	const handleEmergencyContactChnage = (
		field: keyof EmerfencyContact,
		value: string
	): void => {
		setFormData(prev => ({
			...prev,
			emergencyContact: {
				...prev.emergencyContact,
				[field]: value,
			},
		}))
	}

	const handleMedicalHistoryChnage = (
		field: keyof MedicalHistory,
		value: string
	): void => {
		setFormData(prev => ({
			...prev,
			medicalHistory: {
				...prev.medicalHistory,
				[field]: value,
			},
		}))
	}

	const handleSubmit = async (): Promise<void> => {
		try {
			await updateProfile({
				Phone: formData.phone,
				dob: formData.dob,
				gender: formData.gender,
				bloodGroup: formData.bloodGroup,
				emergencyContact: formData.emergencyContact,
				medicalHistory: formData.medicalHistory,
			})
			router.push('/')
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
			<div className='text-center mb-8'>
				<h1 className='text-3xl font-bold text-gray-900 mb-2'>
					{user?.name}, ласкаво просимо до HealOnline
				</h1>
				<p className='text-gray-600'>
					Заповніть профіль, щоб записуватися на прийом
				</p>
			</div>

			{/* Progress step */}
			<div className='flex items-center justify-center mb-8'>
				<div className='flex items-center'>
					{[1, 2, 3].map(step => (
						<React.Fragment key={step}>
							<div
								className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
									currentStep >= step
										? 'bg-blue-600 border-blue-600 text-white'
										: 'border-gray-300 text-gray-400'
								}`}
							>
								{step}
							</div>

							{step < 3 && (
								<div
									className={`w-20 h-1 ${
										currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
									}`}
								></div>
							)}
						</React.Fragment>
					))}
				</div>
			</div>

			<Card className='shadow-lg'>
				<CardContent className='p-8'>
					{currentStep === 1 && (
						<div className='space-y-6'>
							<div className='flex items-center space-x-2 mb-6'>
								<User className='w-5 h-5 text-blue-600' />
								<h2 className='text-xl font-semibold'>Основні дані</h2>
							</div>

							<div className='grid md:grid-cols-2 gap-6'>
								<div className='space-y-2'>
									<Label htmlFor='phone'>Номер телефону</Label>
									<Input
										id='phone'
										name='phone'
										type='tel'
										value={formData.phone}
										placeholder='+380 987 938 888'
										onChange={handleInputChnage}
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='dob'>Дата народження</Label>
									<Input
										id='dob'
										name='dob'
										type='date'
										value={formData.dob}
										onChange={handleInputChnage}
										required
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='gender'>Стать</Label>
									<Select
										value={formData.gender}
										onValueChange={value => handleSelectChange('gender', value)}
									>
										<SelectTrigger>
											<SelectValue placeholder='Оберіть стать'></SelectValue>
										</SelectTrigger>

										<SelectContent>
											<SelectItem value='male'>Чоловіча</SelectItem>
											<SelectItem value='female'>Жіноча</SelectItem>
											<SelectItem value='other'>Інше</SelectItem>
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='bloodGroup'>Група крові</Label>
									<Select
										value={formData.bloodGroup}
										onValueChange={value =>
											handleSelectChange('bloodGroup', value)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Оберіть групу крові'></SelectValue>
										</SelectTrigger>

										<SelectContent>
											<SelectItem value='A+'>A+</SelectItem>
											<SelectItem value='A-'>A-</SelectItem>
											<SelectItem value='B+'>B+</SelectItem>
											<SelectItem value='B-'>B-</SelectItem>
											<SelectItem value='AB+'>AB+</SelectItem>
											<SelectItem value='AB-'>AB-</SelectItem>
											<SelectItem value='O+'>O+</SelectItem>
											<SelectItem value='O-'>O-</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					)}

					{currentStep === 2 && (
						<div className='space-y-6'>
							<div className='flex items-center space-x-2 mb-6'>
								<Phone className='w-5 h-5 text-blue-600' />
								<h2 className='text-xl font-semibold'>Екстрений контакт</h2>
							</div>
							<Alert>
								<AlertDescription>
									Ці дані допоможуть звʼязатися з близькою людиною у разі
									надзвичайної ситуації під час консультації.
								</AlertDescription>
							</Alert>
							<div className='grid md:grid-cols-2 gap-6'>
								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='emergencyName'>Імʼя контактної особи</Label>
									<Input
										id='emergencyName'
										value={formData.emergencyContact.name}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											handleEmergencyContactChnage('name', e.target.value)
										}
										placeholder="Повне імʼя"
										required
									/>
								</div>

								<div className='space-y-2 md:col-span-2'>
									<Label htmlFor='emergencyPhone'>Телефон контакту</Label>
									<Input
										id='emergencyPhone'
										value={formData.emergencyContact.phone}
										onChange={(e: ChangeEvent<HTMLInputElement>) =>
											handleEmergencyContactChnage('phone', e.target.value)
										}
										placeholder='+380 987 938 888'
										required
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='relationship'>Стосунки</Label>
									<Select
										value={formData.emergencyContact.relationship}
										onValueChange={value =>
											handleEmergencyContactChnage('relationship', value)
										}
									>
										<SelectTrigger>
											<SelectValue placeholder='Оберіть стосунки'></SelectValue>
										</SelectTrigger>

										<SelectContent>
											<SelectItem value='spouse'>Подружжя</SelectItem>
											<SelectItem value='parent'>Батько / мати</SelectItem>
											<SelectItem value='child'>Дитина</SelectItem>
											<SelectItem value='sibling'>Брат / сестра</SelectItem>
											<SelectItem value='friend'>Друг</SelectItem>
											<SelectItem value='relative'>Родич</SelectItem>
											<SelectItem value='other'>Інше</SelectItem>
										</SelectContent>
									</Select>
								</div>
							</div>
						</div>
					)}

					{currentStep === 3 && (
						<div className='space-y-6'>
							<div className='flex items-center space-x-2 mb-6'>
								<Phone className='w-5 h-5 text-blue-600' />
								<h2 className='text-xl font-semibold'>Медичні дані</h2>
							</div>
							<Alert>
								<AlertDescription>
									Ці відомості допомагають лікарям надавати кращу допомогу. Усі
									дані конфіденційні та захищені
								</AlertDescription>
							</Alert>
							<div className='space-y-6'>
								<div className='space-y-2'>
									<Label htmlFor='allergies'>Відомі алергії</Label>
									<Textarea
										id='allergies'
										value={formData.medicalHistory.allergies}
										onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
											handleMedicalHistoryChnage('allergies', e.target.value)
										}
										placeholder="напр., пеніцилін, арахіс, пил (або «немає»)"
										rows={3}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='currentMedications'>
										Поточні препарати
									</Label>
									<Textarea
										id='currentMedications'
										value={formData.medicalHistory.currentMedications}
										onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
											handleMedicalHistoryChnage(
												'currentMedications',
												e.target.value
											)
										}
										placeholder="Перелік препаратів, які приймаєте (або «немає»)"
										rows={3}
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='chronicConditions'>Хронічні захворювання</Label>
									<Textarea
										id='chronicConditions'
										value={formData.medicalHistory.chronicConditions}
										onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
											handleMedicalHistoryChnage(
												'chronicConditions',
												e.target.value
											)
										}
										placeholder="напр., діабет, гіпертонія, астма (або «немає»)"
										rows={3}
									/>
								</div>
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
								disabled={
									(currentStep === 1 &&
										(!formData.phone || !formData.dob || !formData.gender)) ||
									(currentStep === 2 &&
										(!formData.emergencyContact.name ||
											!formData.emergencyContact.phone ||
											!formData.emergencyContact.relationship)) ||
									(currentStep === 3 &&
										(!formData.medicalHistory.allergies ||
											!formData.medicalHistory.chronicConditions ||
											!formData.medicalHistory.currentMedications))
								}
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

export default PatientOnboardingForm
