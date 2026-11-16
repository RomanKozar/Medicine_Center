import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
	title: 'Вхід лікаря | HealOnline',
	description:
		'Увійдіть до кабінету лікаря HealOnline - керуйте практикою та консультаціями.',
}

export default function DoctorLoginPage() {
	return <AuthForm type='login' userRole='doctor' />
}
