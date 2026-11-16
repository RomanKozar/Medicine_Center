import ProfilePage from '@/components/ProfilePage/ProfilePage'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Профіль лікаря | HealOnline',
	description: 'Перегляд і редагування профілю лікаря в HealOnline.',
}

export default function Page() {
	return <ProfilePage userType='doctor' />
}
