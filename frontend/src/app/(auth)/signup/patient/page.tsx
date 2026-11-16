import AuthForm from '@/components/auth/AuthForm'

export const metadata = {
	title: 'Реєстрація пацієнта | HealOnline',
	description:
		'Приєднуйтесь до HealOnline для онлайн-консультацій із перевіреними лікарями.',
}

export default function PatientSignUpPage() {
	return <AuthForm type='signup' userRole='patient' />
}
