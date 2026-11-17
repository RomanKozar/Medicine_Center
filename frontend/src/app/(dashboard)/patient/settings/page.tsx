import SettingsPage from '@/components/settings/SettingsPage'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Налаштування пацієнта | HealOnline',
	description: 'Обліковий запис і зміна пароля пацієнта в HealOnline.',
}

export default function Page() {
	return <SettingsPage />
}
