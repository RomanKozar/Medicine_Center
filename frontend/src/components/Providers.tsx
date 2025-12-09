// 'use client'
// import { userAuthStore } from '@/store/authStore'
// import { useEffect } from 'react'

// export function Providers({ children }: { children: React.ReactNode }) {
// 	const { fetchProfile, token } = userAuthStore()
// 	useEffect(() => {
// 		if (token) {
// 			fetchProfile()

// 		}
// 	}, [token, fetchProfile])

// 	return <>{children}</>
// }
'use client'
import { userAuthStore } from '@/store/authStore'
import { useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
	const { fetchProfile, token } = userAuthStore()

	useEffect(() => {
		// 1. Створюємо асинхронну функцію всередині ефекту
		const initAuth = async () => {
			// 2. Перевіряємо наявність токена перед запитом
			if (token) {
				try {
					await fetchProfile()
				} catch (error) {
					console.error('Failed to fetch profile:', error)
				}
			}
		}

		initAuth()

		// 3. Ефект спрацює при монтуванні та якщо зміниться token або функція fetchProfile
	}, [token, fetchProfile])

	return <>{children}</>
}
