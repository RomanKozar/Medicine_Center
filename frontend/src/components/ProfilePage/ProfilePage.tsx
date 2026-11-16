'use client'
import {
	getCategoryLabel,
	getSpecializationLabel,
	healthcareCategories,
	specializations,
} from '@/lib/constant'
import { userAuthStore } from '@/store/authStore'
import {
	Clock,
	FileText,
	MapPin,
	Phone,
	Plus,
	Stethoscope,
	User,
	X,
} from 'lucide-react'
import React, { ChangeEvent, useEffect, useState } from 'react'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import Header from '../landing/Header'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group'
import { el } from 'date-fns/locale'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import { Textarea } from '../ui/textarea'
import { Badge } from '../ui/badge'
import { Checkbox } from '../ui/checkbox'

interface ProfileProps {
	userType: 'doctor' | 'patient'
}
const ProfilePage = ({ userType }: ProfileProps) => {
	const { user, fetchProfile, updateProfile, loading } = userAuthStore()
	const [activeSection, setActiveSection] = useState('about')
	const [isEditing, setIsEditing] = useState(false)

	const [formData, setFormData] = useState<any>({
		name: '',
		email: '',
		phone: '',
		dob: '',
		gender: '',
		bloodGroup: '',
		about: '',
		specialization: '',
		category: [],
		qualification: '',
		experience: 0,
		fees: 0,
		hospitalInfo: {
			name: '',
			address: '',
			city: '',
		},
		medicalHistory: {
			allergies: '',
			currentMedications: '',
			chronicConditions: '',
		},
		emergencyContact: {
			name: '',
			phone: '',
			relationship: '',
		},

		availabilityRange: {
			startDate: '',
			endDate: '',
			excludedWeekdays: [],
		},
		dailyTimeRanges: [],
		slotDurationMinutes: 30,
	})

	useEffect(() => {
		fetchProfile()
	}, [fetchProfile])

	useEffect(() => {
		if (user) {
			setFormData({
				name: user.name || '',
				email: user.email || '',
				phone: user.phone || '',
				dob: user.dob || '',
				gender: user.gender || '',
				bloodGroup: user.bloodGroup || '',
				about: user.about || '',
				specialization: user.specialization || '',
				category: user.category || [],
				qualification: user.qualification || '',
				experience: user.experience || 0,
				fees: user.fees || 0,
				hospitalInfo: {
					name: user.hospitalInfo?.name || '',
					address: user.hospitalInfo?.address || '',
					city: user.hospitalInfo?.city || '',
				},
				medicalHistory: {
					allergies: user.medicalHistory?.allergies || '',
					currentMedications: user.medicalHistory?.currentMedications || '',
					chronicConditions: user.medicalHistory?.chronicConditions || '',
				},
				emergencyContact: {
					name: user.emergencyContact?.name || '',
					phone: user.emergencyContact?.phone || '',
					relationship: user.emergencyContact?.relationship || '',
				},
				availabilityRange: {
					startDate: user.availabilityRange?.startDate || '',
					endDate: user.availabilityRange?.endDate || '',
					excludedWeekdays: user.availabilityRange?.excludedWeekdays || [],
				},
				dailyTimeRanges: user.dailyTimeRanges || [],
				slotDurationMinutes: user.slotDurationMinutes || 30,
			})
		}
	}, [user])

	const handleInputChnage = (field: string, value: any) => {
		if (field.includes('.')) {
			const [parent, child] = field.split('.')
			setFormData((prev: any) => ({
				...prev,
				[parent]: {
					...prev[parent],
					[child]: value,
				},
			}))
		} else {
			setFormData((prev: any) => ({ ...prev, [field]: value }))
		}
	}
	const handleArrayChnage = (
		field: string,
		index: number,
		subField: string,
		value: any
	) => {
		setFormData((prev: any) => ({
			...prev,
			[field]: prev[field].map((item: any, i: number) =>
				i === index ? { ...item, [subField]: value } : item
			),
		}))
	}

	const handleCategorySelect = (category: any): void => {
		if (!formData.category.includes(category.title)) {
			handleInputChnage('category', [...formData.category, category.title])
		}
	}

	const handleCategoryDelete = (indexToDelete: number) => {
		const currentCategories = [...formData.category]
		const newCategories = currentCategories.filter(
			(_: any, i: number) => i !== indexToDelete
		)
		setFormData((prev: any) => ({
			...prev,
			category: newCategories,
		}))
	}

	const getAvailableCategories = () => {
		return healthcareCategories.filter(
			cat => !formData.category.includes(cat.title)
		)
	}

	const addTimeRange = () => {
		setFormData((prev: any) => ({
			...prev,
			dailyTimeRanges: [
				...prev.dailyTimeRanges,
				{ start: '09:00', end: '17:00' },
			],
		}))
	}

	const removeTimeRange = (index: number) => {
		setFormData((prev: any) => ({
			...prev,
			dailyTimeRanges: prev.dailyTimeRanges.filter(
				(_: any, i: number) => i !== index
			),
		}))
	}

	const handleWeekdayToggle = (weekday: number) => {
		const excludedWeekdays = [...formData.availabilityRange.excludedWeekdays]
		const index = excludedWeekdays.indexOf(weekday)

		if (index > -1) {
			excludedWeekdays.splice(index, 1)
		} else {
			excludedWeekdays.push(weekday)
		}

		handleInputChnage('availabilityRange.excludedWeekdays', excludedWeekdays)
	}

	const handleSave = async () => {
		try {
			await updateProfile(formData)
			setIsEditing(false)
		} catch (error) {
			console.error(error)
		}
	}

	const formatDateForInput = (isoDate: string): string => {
		if (!isoDate) return ''
		const date = new Date(isoDate)
		if (isNaN(date.getTime())) return ''
		return date.toISOString().split('T')[0]
	}

	const sidebarItems =
		userType === 'doctor'
			? [
					{ id: 'about', label: 'Про мене', icon: User },
					{
						id: 'professional',
						label: 'Професійні дані',
						icon: Stethoscope,
					},
					{ id: 'hospital', label: 'Лікарня / клініка', icon: MapPin },
					{ id: 'availability', label: 'Доступність', icon: Clock },
			  ]
			: [
					{ id: 'about', label: 'Про мене', icon: User },
					{ id: 'contact', label: 'Контакти', icon: Phone },
					{ id: 'medical', label: 'Медична історія', icon: FileText },
					{ id: 'emergency', label: 'Екстрений контакт', icon: Phone },
			  ]

	const renderAboutSection = () => (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
				<div className='flex flex-col gap-2'>
					<Label>Імʼя та прізвище</Label>
					<Input
						value={formData.name}
						onChange={e => handleInputChnage('name', e.target.value)}
						disabled={!isEditing}
						className='w-80'
					/>
				</div>
			</div>

			{userType === 'patient' && (
				<>
					<div className='flex flex-col gap-2'>
						<Label>Дата народження</Label>
						<Input
							type='date'
							value={
								formData.dob
									? new Date(formData.dob).toISOString().split('T')[0]
									: ''
							}
							onChange={e =>
								handleInputChnage(
									'dob',
									e.target.value
										? new Date(formData.dob).toISOString().split('T')[0]
										: ''
								)
							}
							disabled={!isEditing}
							className='w-80'
						/>
					</div>

					<div className='flex flex-col gap-2'>
						<Label>Стать</Label>
						<RadioGroup
							value={formData.gender || ''}
							onValueChange={value => handleInputChnage('gender', value)}
							disabled={!isEditing}
							className='flex space-y-2'
						>
							<div className='flex items-center space-x-2'>
								<RadioGroupItem value='male' id='male' />
								<Label htmlFor='male'>Чоловіча</Label>
							</div>

							<div className='flex items-center space-x-2'>
								<RadioGroupItem value='female' id='female' />
								<Label htmlFor='female'>Жіноча</Label>
							</div>

							<div className='flex items-center space-x-2'>
								<RadioGroupItem value='other' id='other' />
								<Label htmlFor='other'>Інше</Label>
							</div>
						</RadioGroup>
					</div>

					<div className='flex flex-col gap-2'>
						<Label>Група крові</Label>
						<Select
							value={formData.bloodGroup || ''}
							onValueChange={value => handleInputChnage('bloodGroup', value)}
							disabled={!isEditing}
						>
							<SelectTrigger>
								<SelectValue placeholder='Оберіть групу крові' />
							</SelectTrigger>
							<SelectContent>
								{['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(
									group => (
										<SelectItem key={group} value={group}>
											{group}
										</SelectItem>
									)
								)}
							</SelectContent>
						</Select>
					</div>
				</>
			)}

			{userType === 'doctor' && (
				<div>
					<Label>Про себе</Label>
					<Textarea
						value={formData.about || ''}
						onChange={e => handleInputChnage('about', e.target.value)}
						disabled={!isEditing}
						rows={4}
					/>
				</div>
			)}
		</div>
	)

	const renderProfessionalSection = () => (
		<div className='space-y-6'>
			<div className='flex flex-col gap-2'>
				<Label>Спеціалізація</Label>
				<Select
					value={formData.specialization || ''}
					onValueChange={value => handleInputChnage('specialization', value)}
					disabled={!isEditing}
				>
					<SelectTrigger>
						<SelectValue placeholder='Оберіть спеціалізацію' />
					</SelectTrigger>
					<SelectContent>
						{specializations.map(spec => (
							<SelectItem key={spec} value={spec}>
								{getSpecializationLabel(spec)}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Категорії</Label>
				<div className='flex flex-wrap gap-2 mt-2'>
					{formData.category?.map((cat: string, index: number) => (
						<Badge
							key={index}
							variant='secondary'
							className='flex items-center spacex-1'
						>
							<span>{getCategoryLabel(cat)}</span>
							{isEditing && (
								<button
									type='button'
									className='ml-1 p-0 border-0 bg-transparent cursor-pointer hover:bg-gray-200 rounded-full'
									onClick={e => {
										e.preventDefault()
										e.stopPropagation()
										handleCategoryDelete(index)
									}}
								>
									<X className='w-3 h-3' />
								</button>
							)}
						</Badge>
					))}

					{isEditing && getAvailableCategories().length > 0 && (
						<Select
							onValueChange={value => {
								const selectedCategory = getAvailableCategories().find(
									cate => cate.id === value
								)
								if (selectedCategory) {
									handleCategorySelect(selectedCategory)
								}
							}}
						>
							<SelectTrigger className='w-48'>
								<SelectValue placeholder='Додати категорію' />
							</SelectTrigger>
							<SelectContent>
								{getAvailableCategories().map(category => (
									<SelectItem key={category.id} value={category.id}>
										<div className='flex items-center space-x-2'>
											<div
												className={`w-3 h-3 rounded-full ${category.color}`}
											></div>
											<span>{category.label}</span>
										</div>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					)}

					{isEditing && getAvailableCategories().length === 0 && (
						<span className='text-sm text-gray-500'>
							Усі категорії вже обрано
						</span>
					)}
				</div>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Кваліфікація</Label>
				<Input
					value={formData.qualification || ''}
					onChange={e => handleInputChnage('qualification', e.target.value)}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Досвід (років)</Label>
				<Input
					type='number'
					value={formData.experience || ''}
					onChange={e =>
						handleInputChnage('experience', parseInt(e.target.value) || 0)
					}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Вартість консультації ($)</Label>
				<Input
					type='number'
					value={formData.fees || ''}
					onChange={e =>
						handleInputChnage('fees', parseInt(e.target.value) || 0)
					}
					disabled={!isEditing}
				/>
			</div>
		</div>
	)

	const renderHospitalSection = () => (
		<div className='space-y-6'>
			<div className='flex flex-col gap-2'>
				<Label>Назва лікарні / клініки</Label>
				<Input
					value={formData.hospitalInfo?.name || ''}
					onChange={e =>
						handleInputChnage('hospitalInfo?.name', e.target.value)
					}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Адреса</Label>
				<Textarea
					value={formData.hospitalInfo?.address || ''}
					onChange={e =>
						handleInputChnage('hospitalInfo?.address', e.target.value)
					}
					disabled={!isEditing}
					rows={3}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Місто</Label>
				<Input
					value={formData.hospitalInfo?.city || ''}
					onChange={e =>
						handleInputChnage('hospitalInfo?.city', e.target.value)
					}
					disabled={!isEditing}
				/>
			</div>
		</div>
	)

	const renderAvailabilitySection = () => (
		<div className='space-y-6'>
			<div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
				<div className='flex flex-col gap-2'>
					<Label>Доступний із</Label>
					<Input
						type='date'
						value={formatDateForInput(formData.availabilityRange?.startDate)}
						onChange={e =>
							handleInputChnage('availabilityRange?.startDate', e.target.value)
						}
						disabled={!isEditing}
					/>
				</div>

				<div className='flex flex-col gap-2'>
					<Label>Доступний до</Label>
					<Input
						type='date'
						value={formatDateForInput(formData.availabilityRange?.endDate)}
						onChange={e =>
							handleInputChnage('availabilityRange?.endDate', e.target.value)
						}
						disabled={!isEditing}
					/>
				</div>
			</div>
			<div className='flex flex-col gap-2'>
				<Label>Вихідні дні</Label>
				<div className='flex flex-wrap gap-2'>
					{[
						'Неділя',
						'Понеділок',
						'Вівторок',
						'Середа',
						'Четвер',
						"П'ятниця",
						'Субота',
					].map((day, index) => (
						<label key={index} className='flex items-center space-x-2'>
							<Checkbox
								checked={
									formData.availabilityRange?.excludedWeekdays?.includes(
										index
									) || false
								}
								onCheckedChange={() => handleWeekdayToggle(index)}
								disabled={!isEditing}
							/>
							<span className='text-sm'>{day}</span>
						</label>
					))}
				</div>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Робочі години</Label>
				<div className='space-y-3'>
					{formData.dailyTimeRanges?.map((timeRange: any, index: number) => (
						<div className='flex items-center space-x-2' key={index}>
							<Input
								type='time'
								value={timeRange.start || ''}
								onChange={e =>
									handleArrayChnage(
										'dailyTimeRanges',
										index,
										'start',
										e.target.value
									)
								}
								disabled={!isEditing}
							/>
							<span>до</span>
							<Input
								type='time'
								value={timeRange.end || ''}
								onChange={e =>
									handleArrayChnage(
										'dailyTimeRanges',
										index,
										'end',
										e.target.value
									)
								}
								disabled={!isEditing}
							/>

							{isEditing && (
								<Button
									variant='outline'
									size='sm'
									onClick={() => removeTimeRange(index)}
								>
									<X className='w-4 h-4' />
								</Button>
							)}
						</div>
					))}

					{isEditing && (
						<Button variant='outline' size='sm' onClick={addTimeRange}>
							<Plus className='w-4 h-4 mr-2' />
							Додати інтервал
						</Button>
					)}
				</div>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Тривалість слота (хв)</Label>
				<Select
					value={formData.slotDurationMinutes?.toString() || '30'}
					onValueChange={value =>
						handleInputChnage('slotDurationMinutes', parseInt(value))
					}
					disabled={!isEditing}
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
			</div>
		</div>
	)

	const renderContactSection = () => (
		<div className='space-y-6'>
			<div className='flex flex-col gap-2'>
				<Label>Номер телефону</Label>
				<Input
					value={formData.phone || ''}
					onChange={e => handleInputChnage('phone', e.target.value)}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Електронна пошта</Label>
				<Input value={formData.email || ''} disabled={true} />
			</div>
		</div>
	)

	const renderMedicalSection = () => (
		<div className='space-y-6'>
			<div className='flex flex-col gap-2'>
				<Label>Алергії</Label>
				<Textarea
					value={formData.medicalHistory.allergies || ''}
					onChange={e =>
						handleInputChnage('medicalHistory.allergies', e.target.value)
					}
					disabled={!isEditing}
					rows={3}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Поточні препарати</Label>
				<Textarea
					value={formData.medicalHistory.currentMedications || ''}
					onChange={e =>
						handleInputChnage(
							'medicalHistory.currentMedications',
							e.target.value
						)
					}
					disabled={!isEditing}
					rows={3}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Хронічні захворювання</Label>
				<Textarea
					value={formData.medicalHistory.chronicConditions || ''}
					onChange={e =>
						handleInputChnage(
							'medicalHistory.chronicConditions',
							e.target.value
						)
					}
					disabled={!isEditing}
					rows={3}
				/>
			</div>
		</div>
	)

	const renderEmergencySection = () => (
		<div className='space-y-6'>
			<div className='flex flex-col gap-2'>
				<Label>Імʼя контактної особи</Label>
				<Input
					value={formData.emergencyContact?.name || ''}
					onChange={e =>
						handleInputChnage('emergencyContact?.name', e.target.value)
					}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Телефон контактної особи</Label>
				<Input
					value={formData.emergencyContact?.phone || ''}
					onChange={e =>
						handleInputChnage('emergencyContact?.phone', e.target.value)
					}
					disabled={!isEditing}
				/>
			</div>

			<div className='flex flex-col gap-2'>
				<Label>Хто це для вас</Label>
				<Input
					value={formData.emergencyContact?.relationship || ''}
					onChange={e =>
						handleInputChnage('emergencyContact?.relationship', e.target.value)
					}
					disabled={!isEditing}
				/>
			</div>
		</div>
	)
	const renderContent = () => {
		switch (activeSection) {
			case 'about':
				return renderAboutSection()
			case 'professional':
				return renderProfessionalSection()
			case 'hospital':
				return renderHospitalSection()
			case 'availability':
				return renderAvailabilitySection()
			case 'contact':
				return renderContactSection()
			case 'medical':
				return renderMedicalSection()
			case 'emergency':
				return renderEmergencySection()
			default:
				return renderAboutSection()
		}
	}

	if (!user) return <div>Завантаження...</div>
	return (
		<>
			<Header showDashboardNav={true} />
			<div className='min-h-screen bg-gray-50 pt-16'>
				<div className='container mx-auto px-4 py-8'>
					<div className='mb-8'>
						<h1 className='text-3xl font-bold text-gray-900'>Профіль</h1>
					</div>

					<div className='flex items-center space-x-8 mb-8'>
						<div className='flex flex-col items-center'>
							<Avatar className='w-24 h-24'>
								<AvatarImage src={user?.profileImage} alt={user?.name} />
								<AvatarFallback className='bg-blue-100 text-blue-600 text-2xl font-bold'>
									{user?.name?.charAt(0).toUpperCase()}
								</AvatarFallback>
							</Avatar>
							<p className='mt-2 text-lg font-semibold'>{user?.name}</p>
						</div>
					</div>

					<div className='grid grid-cols-1 lg:grid-cols-4 gap-8'>
						<div className='lg:col-span-1'>
							<div className='space-y-2'>
								{sidebarItems.map(item => (
									<button
										key={item.id}
										onClick={() => setActiveSection(item.id)}
										className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
											activeSection === item.id
												? 'bg-blue-100 text-blue-600 border border-blue-200'
												: 'text-gray-600 hover:bg-gray-100'
										}`}
									>
										<item.icon className='w-5 h-5' />
										<span>{item.label}</span>
									</button>
								))}
							</div>
						</div>
						<div className='lg:col-span-3'>
							<Card>
								<CardContent className='p-8'>
									<div className='flex items-center justify-between mb-6'>
										<h2 className='text-2xl font-semibold capitalize'>
											{
												sidebarItems.find(item => item.id === activeSection)
													?.label
											}
										</h2>
										<div className='flex space-x-2'>
											{isEditing ? (
												<>
													<Button
														variant='outline'
														onClick={() => setIsEditing(false)}
													>
														Скасувати
													</Button>
													<Button onClick={handleSave} disabled={loading}>
														{loading ? 'Збереження...' : 'Зберегти'}
													</Button>
												</>
											) : (
												<Button onClick={() => setIsEditing(true)}>
													Редагувати
												</Button>
											)}
										</div>
									</div>
									{renderContent()}
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</div>
		</>
	)
}

export default ProfilePage
