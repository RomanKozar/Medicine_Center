import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
	title: 'Вхід пацієнта | HealOnline',
	description: 'Увійдіть до облікового запису HealOnline для доступу до консультацій.',
}

export default function PatientLoginPage() {
	return <AuthForm type='login' userRole='patient' />
}
