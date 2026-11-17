import SettingsPage from '@/components/settings/SettingsPage'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Налаштування лікаря | HealOnline',
	description: 'Обліковий запис і зміна пароля лікаря в HealOnline.',
}

export default function Page() {
	return <SettingsPage />
}
