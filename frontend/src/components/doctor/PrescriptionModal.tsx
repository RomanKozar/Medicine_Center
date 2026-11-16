'use client'
import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { FileText, Save, X } from 'lucide-react'
import { Button } from '../ui/button'
import { AlertTitle } from '../ui/alert'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'

interface PrescriptionModalProps {
	isOpen: boolean
	onClose: () => void
	onSave: (prescription: string, notes: string) => Promise<void>
	patientName: string
	loading?: boolean
}
const PrescriptionModal = ({
	isOpen,
	onClose,
	onSave,
	patientName,
	loading,
}: PrescriptionModalProps) => {
	const [prescription, setPrescription] = useState('')
	const [notes, setNotes] = useState('')

	if (!isOpen) return null

	const handleSave = async () => {
		try {
			await onSave(prescription, notes)
			setPrescription('')
			setNotes('')
		} catch (error) {
			console.error('Failed to save prescription')
		}
	}

	const handleClose = () => {
		setPrescription('')
		setNotes('')
		onClose()
	}
	return (
		<div className='fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4'>
			<Card className='w-full max-w-2xl max-h-[90vh] overflow-y-auto'>
				<CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
					<div className='flex items-center space-x-2'>
						<FileText className='w-5 h-5 text-blue-600' />
						<CardTitle>Завершити консультацію</CardTitle>
					</div>
					<Button variant='ghost' size='sm' onClick={handleClose}>
						<X className='w-4 h-4' />
					</Button>
				</CardHeader>
				<CardContent className='space-y-6'>
					<div className='flex items-start space-x-3 p-4 bg-blue-50 rounded-lg'>
						<AlertTitle className='w-5 h-5 text-blue-600 mt-0.5' />

						<div>
							<h3 className='font-semibold text-blue-900'>
								Підтвердження завершення консультації
							</h3>
							<p className='text-sm text-blue-700 mt-1'>
								Ви впевнені, що хочете завершити консультацію з{' '}
								<strong>{patientName}</strong>?
							</p>
						</div>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='prescription' className='text-sm font-medium'>
							Рецепт <span className='text-red-500'>*</span>
						</Label>
						<Textarea
							id='prescription'
							value={prescription}
							onChange={e => setPrescription(e.target.value)}
							placeholder='Вкажіть препарати, дозування та інструкції'
							rows={6}
							className='min-h-[120px]'
							required
						/>
						<p className='text-xs text-gray-500'>
							Вкажіть назви препаратів, дози, частоту прийому та особливі
							вказівки.
						</p>
					</div>

					<div className='space-y-2'>
						<Label htmlFor='notes' className='text-sm font-medium'>
							Додаткові нотатки (необовʼязково)
						</Label>
						<Textarea
							id='notes'
							value={notes}
							onChange={e => setNotes(e.target.value)}
							placeholder='Додаткові нотатки щодо консультації, рекомендації для нагляду...'
							rows={4}
							className='min-h-[120px]'
						/>
					</div>

					<div className='flex justify-end space-x-3 pt-4 border-t'>
						<Button variant='outline' onClick={handleClose} disabled={loading}>
							Скасувати
						</Button>

						<Button
							onClick={handleSave}
							disabled={!prescription.trim() || loading}
							className='bg-green-600 hover:bg-green-700'
						>
							{loading ? (
								<>
									<div className='animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2' />
									Збереження...
								</>
							) : (
								<>
									<Save className='w-4 h-4 mr-2' />
									Зберегти й завершити
								</>
							)}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

export default PrescriptionModal
