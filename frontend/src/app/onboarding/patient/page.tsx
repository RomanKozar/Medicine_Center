import PatientOnboardingForm from '@/components/patient/PatientOnboardingForm'

export const metadata = {
	title: 'Заповніть профіль пацієнта | HealOnline',
	description: 'Завершіть профіль, щоб записуватися на прийом.',
}

export default function PatientOnboardingPage() {
	return <PatientOnboardingForm />
}
