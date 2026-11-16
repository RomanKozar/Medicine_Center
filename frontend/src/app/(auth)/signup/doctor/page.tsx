import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
	title: 'Реєстрація лікаря | HealOnline',
	description:
		'Зареєструйтеся як лікар у HealOnline і надавайте консультації онлайн.',
}

export default function DoctorSignUpPage() {
	return <AuthForm type='signup' userRole='doctor' />
}
