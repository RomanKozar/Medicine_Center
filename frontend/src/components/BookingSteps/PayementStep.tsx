import { getConsultationTypeLabel } from '@/lib/constant'
import React, { useState } from 'react'
import { Separator } from '@/components/ui/separator'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, CreditCard, Loader2, Shield, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PaymentStepInterface {
	selectedDate: Date | undefined
	selectedSlot: string
	consultationType: string
	doctorName: string
	slotDuration: number
	consultationFee: number
	isProcessing: boolean
	onBack: () => void
	onConfirm: () => void
	onPaymentSuccess?: (appointment: any) => void
	loading: boolean
	appointmentId?: string
	patientName?: string
}

const PayementStep = ({
	selectedDate,
	selectedSlot,
	consultationType,
	doctorName,
	slotDuration,
	consultationFee,
	isProcessing,
	onBack,
	onConfirm,
	onPaymentSuccess,
	loading,
	appointmentId,
	patientName,
}: PaymentStepInterface) => {
	const [paymentStatus, setPaymentStatus] = useState<
		'idle' | 'processing' | 'success' | 'failed'
	>('idle')
	const [isPaymentLoading, setIsPaymentLoading] = useState<boolean>(false)

	const platformFees = Math.round(consultationFee * 0.1)
	const totalAmount = consultationFee + platformFees

	// MOCK PAYMENT - симуляція оплати
	const handleMockPayment = async () => {
		setIsPaymentLoading(true)
		setPaymentStatus('processing')

		// Симуляція затримки обробки платежу (2 секунди)
		await new Promise(resolve => setTimeout(resolve, 2000))

		// 90% успішних платежів, 10% невдалих (для тестування)
		const isSuccess = Math.random() > 0.1

		if (isSuccess) {
			setPaymentStatus('success')

			// Симуляція даних успішного платежу
			const mockPaymentData = {
				paymentId: `MOCK_${Date.now()}`,
				orderId: `ORDER_${Date.now()}`,
				amount: totalAmount,
				status: 'success',
				appointmentId,
			}

			// Затримка перед переходом
			await new Promise(resolve => setTimeout(resolve, 1500))

			if (onPaymentSuccess) {
				onPaymentSuccess(mockPaymentData)
			} else {
				onConfirm()
			}
		} else {
			setPaymentStatus('failed')
		}

		setIsPaymentLoading(false)
	}

	const handlePaynow = () => {
		if (appointmentId && patientName) {
			handleMockPayment()
		} else {
			onConfirm()
		}
	}

	return (
		<div className='space-y-8'>
			<div>
				<h3 className='text-2xl font-bold text-gray-900 mb-6'>
					Оплата та підтвердження
				</h3>

				{/* Mock Payment Warning */}
				<div className='flex items-center space-x-3 p-4 bg-yellow-50 rounded-lg mb-6 border border-yellow-200'>
					<Shield className='w-6 h-6 text-yellow-600' />
					<div>
						<p className='font-medium text-yellow-800'>Тестовий режим</p>
						<p className='text-sm text-yellow-700'>
							Це імітація оплати для тестування
						</p>
					</div>
				</div>

				<div className='bg-gray-50 rounded-lg p-6 mb-8'>
					<h4 className='font-semibold text-gray-900 mb-4'>
						Підсумок запису
					</h4>
					<div className='space-y-3'>
						<div className='flex justify-between'>
							<span className='text-gray-600'>Дата й час</span>
							<span className='font-medium'>
								{selectedDate?.toLocaleDateString('uk-UA')} о {selectedSlot}
							</span>
						</div>

						<div className='flex justify-between'>
							<span className='text-gray-600'>Тип консультації</span>
							<span className='font-medium'>
								{getConsultationTypeLabel(consultationType)}
							</span>
						</div>

						<div className='flex justify-between'>
							<span className='text-gray-600'>Лікар</span>
							<span className='font-medium'>{doctorName}</span>
						</div>

						<div className='flex justify-between'>
							<span className='text-gray-600'>Тривалість</span>
							<span className='font-medium'>{slotDuration} хв</span>
						</div>

						<Separator />

						<div className='flex justify-between'>
							<span className='text-gray-600'>Вартість консультації</span>
							<span className='font-medium'>${consultationFee}</span>
						</div>

						<div className='flex justify-between'>
							<span className='text-gray-600'>Комісія платформи</span>
							<span className='font-medium'>${platformFees}</span>
						</div>

						<Separator />

						<div className='flex justify-between text-lg'>
							<span className='font-semibold'>Разом</span>
							<span className='font-bold text-green-600'>${totalAmount}</span>
						</div>
					</div>
				</div>

				<AnimatePresence mode='wait'>
					{paymentStatus === 'processing' && (
						<motion.div
							key='processing'
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className='text-center py-12'
						>
							<Loader2 className='w-12 h-12 mx-auto mb-4 text-blue-600 animate-spin' />
							<h4 className='text-lg font-semibold text-gray-900 mb-2'>
								Обробка оплати...
							</h4>
							<p className='text-gray-600 mb-4'>
								Імітація обробки платежу (тестовий режим)
							</p>
							<div className='w-full bg-gray-200 rounded-full h-2 overflow-hidden'>
								<motion.div
									initial={{ width: '0%' }}
									animate={{ width: '100%' }}
									transition={{ duration: 2 }}
									className='h-full bg-blue-600'
								/>
							</div>
						</motion.div>
					)}

					{paymentStatus === 'success' && (
						<motion.div
							key='success'
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className='text-center py-12'
						>
							<CheckCircle className='w-16 h-16 mx-auto mb-4 text-green-600' />
							<h4 className='text-lg font-semibold text-green-800 mb-2'>
								Оплату успішно прийнято!
							</h4>
							<p className='text-gray-600 mb-4'>
								Ваш запис підтверджено
							</p>
							<p className='text-sm text-gray-500'>
								Перенаправлення до кабінету...
							</p>
						</motion.div>
					)}

					{paymentStatus === 'failed' && (
						<motion.div
							key='failed'
							initial={{ opacity: 0, scale: 0.95 }}
							animate={{ opacity: 1, scale: 1 }}
							exit={{ opacity: 0, scale: 0.95 }}
							className='text-center py-12'
						>
							<XCircle className='w-16 h-16 mx-auto mb-4 text-red-600' />
							<h4 className='text-lg font-semibold text-red-800 mb-2'>
								Оплату не вдалося виконати
							</h4>
							<p className='text-gray-600 mb-4'>
								Спробуйте ще раз.
							</p>
							<Button
								onClick={() => {
									setPaymentStatus('idle')
								}}
								variant='outline'
								className='text-red-600 border-red-600 hover:bg-red-50'
							>
								Спробувати знову
							</Button>
						</motion.div>
					)}
				</AnimatePresence>

				{paymentStatus === 'idle' && (
					<div className='flex items-center space-x-3 p-4 bg-green-50 rounded-lg mb-8'>
						<Shield className='w-6 h-6 text-green-600' />
						<div>
							<p className='font-medium text-green-800'>Безпечна оплата</p>
							<p className='text-sm text-green-700'>
								Платіж захищено шифруванням SSL 256-bit
							</p>
						</div>
					</div>
				)}
			</div>

			{paymentStatus === 'idle' && (
				<div className='flex justify-between gap-2'>
					<Button variant='outline' onClick={onBack} className='px-8 py-3'>
						Назад
					</Button>
					<Button
						onClick={handlePaynow}
						disabled={loading || isPaymentLoading}
						className='px-8 py-3 bg-green-600 hover:bg-green-700 text-lg font-semibold'
					>
						{loading ? (
							<>
								<Loader2 className='w-5 h-5 mr-2 animate-spin' />
								<span className='text-sm md:text-lg'>
									Створення запису...
								</span>
							</>
						) : isPaymentLoading ? (
							<>
								<Loader2 className='w-5 h-5 mr-2 animate-spin' />
								<span className='text-sm md:text-lg'>Обробка...</span>
							</>
						) : (
							<>
								<CreditCard className='w-5 h-5 mr-2' />
								<span className='text-sm md:text-lg'>
									Сплатити ${totalAmount} і записатися (ТЕСТ)
								</span>
							</>
						)}
					</Button>
				</div>
			)}
		</div>
	)
}

export default PayementStep
