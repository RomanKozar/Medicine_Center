import {
	Facebook,
	Instagram,
	Linkedin,
	Twitter,
	Phone,
	Mail,
	MapPin,
	Video,
	Clock,
	FileText,
} from 'lucide-react'

export const healthcareCategories = [
	{
		id: 'primary-care',
		title: 'Primary Care',
		label: 'Первинна допомога',
		icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
		color: 'bg-blue-500',
	},
	{
		id: 'manage-condition',
		title: 'Manage Your Condition',
		label: 'Контроль захворювання',
		icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
		color: 'bg-green-500',
	},
	{
		id: 'mental-behavioral-health',
		title: 'Mental & Behavioral Health',
		label: 'Ментальне здоровʼя',
		icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z',
		color: 'bg-yellow-500',
	},
	{
		id: 'sexual-health',
		title: 'Sexual Health',
		label: 'Сексуальне здоровʼя',
		icon: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
		color: 'bg-pink-500',
	},
	{
		id: 'childrens-health',
		title: "Children's Health",
		label: "Здоровʼя дітей",
		icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v2h-2zm0-8h2v6h-2z',
		color: 'bg-red-500',
	},
	{
		id: 'senior-health',
		title: 'Senior Health',
		label: 'Здоровʼя літніх людей',
		icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z',
		color: 'bg-orange-500',
	},
	{
		id: 'womens-health',
		title: "Women's Health",
		label: "Жіноче здоровʼя",
		icon: 'M17.5 9.5C17.5 6.5 15 4 12 4S6.5 6.5 6.5 9.5c0 2.89 2.39 5.43 5.5 6.44V17c0 .55.45 1 1 1s1-.45 1-1v-1.06c3.11-1.01 5.5-3.55 5.5-6.44zM12 14.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z',
		color: 'bg-purple-500',
	},
	{
		id: 'mens-health',
		title: "Men's Health",
		label: "Чоловіче здоровʼя",
		icon: 'M17.5 9.5C17.5 6.5 15 4 12 4S6.5 6.5 6.5 9.5c0 2.89 2.39 5.43 5.5 6.44V20h3v-4.06c3.11-1.01 5.5-3.55 5.5-6.44z',
		color: 'bg-indigo-500',
	},
	{
		id: 'wellness',
		title: 'Wellness',
		label: 'Велнес і профілактика',
		icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
		color: 'bg-emerald-500',
	},
]

// Healthcare categories (matches backend)
export const healthcareCategoriesList = [
	'Primary Care',
	'Manage Your Condition',
	'Mental & Behavioral Health',
	'Sexual Health',
	"Children's Health",
	'Senior Health',
	"Women's Health",
	"Men's Health",
	'Wellness',
]

export const getCategoryLabel = (title: string): string => {
	const found = healthcareCategories.find(c => c.title === title)
	return found?.label ?? title
}

export const specializations = [
	'Cardiologist',
	'Dermatologist',
	'Orthopedic',
	'Pediatrician',
	'Neurologist',
	'Gynecologist',
	'General Physician',
	'ENT Specialist',
	'Psychiatrist',
	'Ophthalmologist',
]

export const specializationLabels: Record<string, string> = {
	Cardiologist: 'Кардіолог',
	Dermatologist: 'Дерматолог',
	Orthopedic: 'Ортопед',
	Pediatrician: 'Педіатр',
	Neurologist: 'Невролог',
	Gynecologist: 'Гінеколог',
	'General Physician': 'Сімейний лікар',
	'ENT Specialist': 'ЛОР-лікар',
	Psychiatrist: 'Психіатр',
	Ophthalmologist: 'Офтальмолог',
}

export const getSpecializationLabel = (spec: string): string =>
	specializationLabels[spec] ?? spec

export const cities = [
	'Київ',
	'Львів',
	'Одеса',
	'Харків',
	'Дніпро',
	'Запоріжжя',
	'Вінниця',
	'Ужгород',
]

export const socials = [
	{ name: 'twitter', icon: Twitter, url: 'https://twitter.com/medicare-plus' },
	{
		name: 'facebook',
		icon: Facebook,
		url: 'https://facebook.com/medicare-plus',
	},
	{
		name: 'linkedin',
		icon: Linkedin,
		url: 'https://linkedin.com/company/medicare-plus',
	},
	{
		name: 'instagram',
		icon: Instagram,
		url: 'https://instagram.com/medicare-plus',
	},
]

export const getStatusColor = (status: string) => {
	switch (status.toLowerCase()) {
		case 'confirmed':
			return 'bg-green-100 text-green-800'
		case 'pending':
			return 'bg-yellow-100 text-yellow-800'
		case 'completed':
			return 'bg-blue-100 text-blue-800'
		case 'cancelled':
			return 'bg-red-100 text-red-800'
		case 'in progress':
			return 'bg-purple-100 text-purple-800'
		case 'scheduled':
			return 'bg-gray-100 text-gray-800'
		default:
			return 'bg-gray-100 text-gray-800'
	}
}

export const getStatusLabel = (status: string): string => {
	switch (status) {
		case 'Scheduled':
			return 'Заплановано'
		case 'Completed':
			return 'Завершено'
		case 'Cancelled':
			return 'Скасовано'
		case 'In Progress':
			return 'Триває'
		default:
			return status
	}
}

export const getPriorityColor = (level: string) => {
	switch (level) {
		case 'emergency':
			return 'bg-red-100 text-red-800'
		case 'urgent':
			return 'bg-orange-100 text-orange-800'
		case 'planned':
			return 'bg-blue-100 text-blue-800'
		case 'routine':
			return 'bg-gray-100 text-gray-700'
		default:
			return 'bg-gray-100 text-gray-700'
	}
}

export const getConsultationTypeLabel = (type: string): string => {
	switch (type) {
		case 'Video Consultation':
			return 'Відеоконсультація'
		case 'Voice Call':
			return 'Голосовий дзвінок'
		default:
			return type
	}
}

export const getRoleLabel = (role: string): string => {
	switch (role) {
		case 'doctor':
			return 'лікар'
		case 'patient':
			return 'пацієнт'
		default:
			return role
	}
}

export const testimonials = [
	{
		rating: 5,
		text: 'Лікар відповів одразу, уважно вислухав симптоми й підібрав лікування. Пояснив призначення - швидко й без зайвих кроків.',
		author: 'Павло К.',
		location: 'м. Київ',
		bgColor: 'bg-chart-1/10',
	},
	{
		rating: 5,
		text: 'Відчував себе комфортно ще до початку розмови. Легко задавати питання - отримав зрозумілі відповіді.',
		author: 'Олена П.',
		location: 'м. Львів',
		bgColor: 'bg-chart-2/10',
	},
	{
		rating: 5,
		text: 'Лікарка була професійною й ретельною, поставила багато доречних питань. Відповіді - детальні й зрозумілі.',
		author: 'Богдана М.',
		location: 'м. Одеса',
		bgColor: 'bg-chart-4/10',
	},
	{
		rating: 5,
		text: 'Запис зайняв кілька хвилин, наступного ранку вже була консультація. Оновила рецепт, не виходячи з дому - для мене в селі це справжня знахідка.',
		author: 'Катерина М.',
		location: 'м. Вінниця',
		bgColor: 'bg-chart-5/10',
	},
]

export const footerSections = [
	{
		title: 'Компанія',
		links: [
			{ text: 'Як рахується пріоритет', href: '/priority-rules' },
			{ text: 'Центр підтримки', href: '/support' },
			{ text: 'Звʼязатися з нами', href: '/contact' },
		],
	},
	{
		title: 'Для лікарів',
		links: [
			{ text: 'Приєднатися як лікар', href: '/signup/doctor' },
			{ text: 'Ресурси для лікарів', href: '/doctor-resources' },
		],
	},
	{
		title: 'Для пацієнтів',
		links: [
			{ text: 'Знайти лікарів', href: '/doctors' },
			{ text: 'Записатися на прийом', href: '/signup/patient' },
		],
	},
	{
		title: 'Правова інформація',
		links: [
			{ text: 'Політика конфіденційності', href: '/privacy' },
			{ text: 'Умови користування', href: '/terms' },
		],
	},
]

export const contactInfo = [
	{
		icon: Phone,
		text: '0 800 33 63 22',
	},
	{
		icon: Mail,
		text: 'support@medicare-plus.com',
	},
	{
		icon: MapPin,
		text: 'Доступно по всій Україні',
	},
]

export const faqs = [
	{
		question: 'Скільки коштує консультація з лікарем у HealOnline?',
		answer:
			'За наявності страхування ви сплачуєте частку згідно з планом. Ми співпрацюємо з багатьма страховими програмами. Без страхування онлайн-візит коштує від 129 $. Учасники HealOnline - від 44 $ за візит; абонемент - 55 $ на три місяці або 180 $ на рік.',
	},
	{
		question: 'Чи приймаєте ви медичне страхування?',
		answer:
			'Так, ми працюємо з більшістю поширених страхових планів. Також можна сплачувати з рахунків FSA та HSA, де це передбачено.',
	},
	{
		question: 'Які стани можуть лікувати лікарі HealOnline?',
		answer:
			'Наші лікарі консультують із широкого спектру питань: застуда та грип, алергії, шкірні захворювання, психічне здоровʼя, хронічні стани та багато іншого - дистанційно.',
	},
	{
		question: 'Як швидко можна потрапити на прийом?',
		answer:
			'Багато лікарів доступні в той самий день, іноді - одразу. Ви обираєте зручний час, часто вже за кілька годин після запиту.',
	},
]

export const trustLogos = [
	'Business Insider',
	'CBS News',
	'CNBC',
	'Forbes',
	'Fortune',
	'Fox Business',
	'Healthline',
	'Inc.',
	"Men's Health",
	'TechCrunch',
	'The New York Times',
	'WSJ',
]

export const consultationTypes = [
	{
		type: 'Video Consultation',
		icon: Video,
		description: 'Очна консультація через відеодзвінок у HD-якості',
		price: 0,
		recommended: true,
	},
	{
		type: 'Voice Call',
		icon: Phone,
		description: 'Консультація лише голосом',
		price: -100,
		recommended: false,
	},
]

export const emptyStates = {
	upcoming: {
		icon: Clock,
		title: 'Немає майбутніх записів',
		description: 'У вас немає запланованих майбутніх візитів.',
	},
	completed: {
		icon: FileText,
		title: 'Немає завершених записів',
		description: 'Завершені консультації зʼявляться тут.',
	},
}
