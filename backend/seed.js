/**
 * Demo accounts for HealOnline.
 * Password for every account: Password123
 * Safe to run again: existing emails are skipped.
 */
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Doctor = require('./modal/Doctor')
const Patient = require('./modal/Patient')

const PASSWORD = 'Password123'

const availability = {
	startDate: '2026-01-01',
	endDate: '2026-12-31',
	excludedWeekdays: [0],
}

const slots = [
	{ start: '09:00', end: '13:00' },
	{ start: '14:00', end: '18:00' },
]

const doctors = [
	{
		name: 'Ольга Коваленко',
		email: 'olha.kovalenko@healonline.test',
		specialization: 'Cardiologist',
		category: ['Primary Care', 'Senior Health'],
		qualification: 'Кандидат медичних наук',
		experience: 12,
		about: 'Кардіолог. Консультації щодо тиску, аритмії та профілактики серцево-судинних захворювань.',
		fees: 800,
		hospitalInfo: {
			name: 'Клініка Серце',
			address: 'вул. Хрещатик, 22',
			city: 'Київ',
		},
	},
	{
		name: 'Андрій Мельник',
		email: 'andrii.melnyk@healonline.test',
		specialization: 'Dermatologist',
		category: ['Primary Care', 'Wellness'],
		qualification: 'Лікар-дерматовенеролог',
		experience: 8,
		about: 'Дерматолог. Акне, алергічні висипання, огляди родимок онлайн.',
		fees: 650,
		hospitalInfo: {
			name: 'Медичний центр Дерма',
			address: 'вул. Городоцька, 15',
			city: 'Львів',
		},
	},
	{
		name: 'Марія Шевченко',
		email: 'maria.shevchenko@healonline.test',
		specialization: 'Pediatrician',
		category: ["Children's Health", 'Primary Care'],
		qualification: 'Лікар-педіатр вищої категорії',
		experience: 15,
		about: 'Педіатр. Консультації для дітей: ГРВІ, алергії, планові огляди.',
		fees: 700,
		hospitalInfo: {
			name: 'Дитяча поліклініка №3',
			address: 'вул. Дерибасівська, 8',
			city: 'Одеса',
		},
	},
	{
		name: 'Іван Бондаренко',
		email: 'ivan.bondarenko@healonline.test',
		specialization: 'Neurologist',
		category: ['Manage Your Condition', 'Senior Health'],
		qualification: 'Невролог',
		experience: 10,
		about: 'Невролог. Головний біль, мігрень, остеохондроз, наслідки стресу.',
		fees: 900,
		hospitalInfo: {
			name: 'Неврологічний центр',
			address: 'просп. Науки, 4',
			city: 'Харків',
		},
	},
	{
		name: 'Олена Ткаченко',
		email: 'olena.tkachenko@healonline.test',
		specialization: 'Gynecologist',
		category: ["Women's Health"],
		qualification: 'Акушер-гінеколог',
		experience: 11,
		about: 'Гінеколог. Планові консультації, цикл, контрацепція, підготовка до вагітності.',
		fees: 750,
		hospitalInfo: {
			name: 'Жіноча консультація',
			address: 'вул. Центральна, 19',
			city: 'Дніпро',
		},
	},
	{
		name: 'Тарас Савчук',
		email: 'taras.savchuk@healonline.test',
		specialization: 'Orthopedic',
		category: ['Manage Your Condition', 'Wellness'],
		qualification: 'Ортопед-травматолог',
		experience: 9,
		about: 'Ортопед. Болі в суглобах, спортивні травми, реабілітація.',
		fees: 850,
		hospitalInfo: {
			name: 'Ортопедична клініка',
			address: 'вул. Корзо, 7',
			city: 'Ужгород',
		},
	},
	{
		name: 'Наталія Кравець',
		email: 'natalia.kravets@healonline.test',
		specialization: 'ENT Specialist',
		category: ['Primary Care', "Children's Health"],
		qualification: 'Отоларинголог',
		experience: 7,
		about: 'ЛОР. Нежить, отит, біль у горлі, хронічний тонзиліт.',
		fees: 600,
		hospitalInfo: {
			name: 'ЛОР-центр',
			address: 'вул. Соборна, 31',
			city: 'Вінниця',
		},
	},
	{
		name: 'Сергій Лисенко',
		email: 'serhii.lysenko@healonline.test',
		specialization: 'Psychiatrist',
		category: ['Mental & Behavioral Health'],
		qualification: 'Лікар-психіатр',
		experience: 14,
		about: 'Психіатр. Тривога, безсоння, вигорання, підтримка при депресії.',
		fees: 950,
		hospitalInfo: {
			name: 'Центр ментального здоровʼя',
			address: 'просп. Соборний, 100',
			city: 'Запоріжжя',
		},
	},
	{
		name: 'Юлія Мороз',
		email: 'yulia.moroz@healonline.test',
		specialization: 'Ophthalmologist',
		category: ['Primary Care', 'Wellness'],
		qualification: 'Офтальмолог',
		experience: 6,
		about: 'Офтальмолог. Втома очей, підбір тактики при короткозорості, консультації онлайн.',
		fees: 700,
		hospitalInfo: {
			name: 'Офтальмологічна клініка Зір',
			address: 'вул. Саксаганського, 12',
			city: 'Київ',
		},
	},
	{
		name: 'Петро Гнатюк',
		email: 'petro.hnatiuk@healonline.test',
		specialization: 'General Physician',
		category: ['Primary Care', 'Wellness', 'Senior Health'],
		qualification: 'Сімейний лікар',
		experience: 18,
		about: 'Сімейний лікар. Загальні консультації, застуда, тиск, направлення до спеціалістів.',
		fees: 500,
		hospitalInfo: {
			name: 'Сімейна амбулаторія',
			address: 'вул. Шевченка, 44',
			city: 'Львів',
		},
	},
]

const patients = [
	{
		name: 'Анна Петренко',
		email: 'anna.petrenko@healonline.test',
		phone: '+380501112233',
		dob: new Date('1998-04-12'),
		gender: 'female',
		bloodGroup: 'A+',
		emergencyContact: {
			name: 'Олег Петренко',
			phone: '+380671112233',
			relationship: 'чоловік',
		},
		medicalHistory: {
			allergies: 'Пеніцилін',
			currentMedications: 'Немає',
			chronicConditions: 'Немає',
		},
	},
	{
		name: 'Богдан Руденко',
		email: 'bohdan.rudenko@healonline.test',
		phone: '+380631234567',
		dob: new Date('1992-11-03'),
		gender: 'male',
		bloodGroup: 'O+',
		emergencyContact: {
			name: 'Ірина Руденко',
			phone: '+380931234567',
			relationship: 'сестра',
		},
		medicalHistory: {
			allergies: 'Немає',
			currentMedications: 'Лозартан 50 мг',
			chronicConditions: 'Артеріальна гіпертензія',
		},
	},
	{
		name: 'Софія Марчук',
		email: 'sofia.marchuk@healonline.test',
		phone: '+380971111111',
		dob: new Date('2001-07-21'),
		gender: 'female',
		bloodGroup: 'B+',
		emergencyContact: {
			name: 'Галина Марчук',
			phone: '+380501111111',
			relationship: 'мати',
		},
		medicalHistory: {
			allergies: 'Пилок',
			currentMedications: 'Цетиризин за потреби',
			chronicConditions: 'Сезонна алергія',
		},
	},
	{
		name: 'Максим Коваль',
		email: 'maksym.koval@healonline.test',
		phone: '+380661010101',
		dob: new Date('1987-01-30'),
		gender: 'male',
		bloodGroup: 'AB+',
		emergencyContact: {
			name: 'Назар Коваль',
			phone: '+380661010102',
			relationship: 'брат',
		},
		medicalHistory: {
			allergies: 'Немає',
			currentMedications: 'Немає',
			chronicConditions: 'Біль у попереку',
		},
	},
	{
		name: 'Ірина Білоус',
		email: 'iryna.bilous@healonline.test',
		phone: '+380932222222',
		dob: new Date('1995-09-08'),
		gender: 'female',
		bloodGroup: 'A-',
		emergencyContact: {
			name: 'Тарас Білоус',
			phone: '+380932222223',
			relationship: 'чоловік',
		},
		medicalHistory: {
			allergies: 'Немає',
			currentMedications: 'Фолієва кислота',
			chronicConditions: 'Немає',
		},
	},
	{
		name: 'Дмитро Остапенко',
		email: 'dmytro.ostapenko@healonline.test',
		phone: '+380503333333',
		dob: new Date('1984-02-17'),
		gender: 'male',
		bloodGroup: 'O-',
		emergencyContact: {
			name: 'Леся Остапенко',
			phone: '+380503333334',
			relationship: 'дружина',
		},
		medicalHistory: {
			allergies: 'Аспірин',
			currentMedications: 'Немає',
			chronicConditions: 'Мігрень',
		},
	},
]

async function upsertMany(Model, items, label) {
	const hashed = await bcrypt.hash(PASSWORD, 12)
	let created = 0
	let skipped = 0

	for (const item of items) {
		const exists = await Model.findOne({ email: item.email })
		if (exists) {
			skipped += 1
			continue
		}
		await Model.create({
			...item,
			password: hashed,
			isVerified: true,
			isActive: true,
		})
		created += 1
	}

	console.log(`${label}: created ${created}, skipped ${skipped}`)
}

async function main() {
	await mongoose.connect(process.env.MONGO_URL)
	await upsertMany(
		Doctor,
		doctors.map(d => ({
			...d,
			availabilityRange: availability,
			dailyTimeRanges: slots,
			slotDurationMinutes: 30,
		})),
		'Doctors'
	)
	await upsertMany(Patient, patients, 'Patients')
	await mongoose.disconnect()
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
