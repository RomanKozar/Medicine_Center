import ProfilePage from '@/components/ProfilePage/ProfilePage'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Профіль пацієнта | HealOnline',
	description: 'Перегляд і редагування профілю пацієнта в HealOnline.',
}

export default function Page() {
	return <ProfilePage userType='patient' />
}
