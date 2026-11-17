/**
 * Демо-черга для однієї лікарки і кількох пацієнтів.
 * Повторний запуск замінює лише записи з позначкою «Демо-черга:».
 *
 * Лікар: olha.kovalenko@healonline.test
 * Пароль: Password123
 */
require('dotenv').config()
const mongoose = require('mongoose')
const Doctor = require('./modal/Doctor')
const Patient = require('./modal/Patient')
const Appointment = require('./modal/Appointment')
const {
	prioritizeAppeal,
	triageFromContext,
	doctorPriority,
	sortQueue,
} = require('./utils/prioritize')

const MARK = 'Демо-черга:'
const DOCTOR_EMAIL = 'olha.kovalenko@healonline.test'

function atSlot(dayOffset, hour, minute = 0) {
	const date = new Date()
	date.setDate(date.getDate() + dayOffset)
	date.setHours(hour, minute, 0, 0)
	return date
}

const examples = [
	{
		patient: 'anna.petrenko@healonline.test',
		day: 1,
		hour: 9,
		symptoms: 'Легка застуда вже третій тиждень, температури немає.',
		triage: { complaint: 'cold', severity: 2, durationHours: 400, redFlags: [] },
	},
	{
		patient: 'maksym.koval@healonline.test',
		day: 1,
		hour: 9,
		minute: 30,
		symptoms: 'Сухі плями на лікті, майже не сверблять.',
		triage: { complaint: 'skin', severity: 3, durationHours: 120, redFlags: [] },
	},
	{
		patient: 'sofia.marchuk@healonline.test',
		day: 1,
		hour: 10,
		symptoms: 'Нежить і чхання другий день, самопочуття задовільне.',
		triage: { complaint: 'cold', severity: 3, durationHours: 48, redFlags: [] },
	},
	{
		patient: 'iryna.bilous@healonline.test',
		day: 1,
		hour: 10,
		minute: 30,
		symptoms: 'Питання щодо вітамінів, гострих скарг немає.',
		triage: { complaint: 'other', severity: 2, durationHours: 200, redFlags: [] },
		consultationType: 'Voice Call',
	},
	{
		patient: 'bohdan.rudenko@healonline.test',
		day: 1,
		hour: 11,
		symptoms: 'Висип на передпліччі, свербіж посилився за ніч.',
		triage: { complaint: 'skin', severity: 4, durationHours: 48, redFlags: [] },
		override: {
			level: 'urgent',
			reason:
				'Висип швидко поширюється і пацієнт прокинувся від свербежу, тому піднімаю пріоритет.',
		},
	},
	{
		patient: 'dmytro.ostapenko@healonline.test',
		day: 1,
		hour: 11,
		minute: 30,
		symptoms: 'Ниючий біль у животі близько доби, без блювання.',
		triage: { complaint: 'abdominal', severity: 5, durationHours: 48, redFlags: [] },
	},
	{
		patient: 'anna.petrenko@healonline.test',
		day: 1,
		hour: 12,
		symptoms: 'Біль у животі після їжі, нудота, триває близько доби.',
		triage: { complaint: 'abdominal', severity: 7, durationHours: 20, redFlags: [] },
	},
	{
		patient: 'maksym.koval@healonline.test',
		day: 1,
		hour: 12,
		minute: 30,
		symptoms: 'Розтягування гомілки після пробіжки, наступати боляче.',
		triage: { complaint: 'injury', severity: 6, durationHours: 12, redFlags: [] },
	},
	{
		patient: 'sofia.marchuk@healonline.test',
		day: 1,
		hour: 14,
		symptoms: 'Алергія на пилок: свербіж очей і закладений ніс зранку.',
		triage: { complaint: 'allergy', severity: 6, durationHours: 4, redFlags: [] },
	},
	{
		patient: 'iryna.bilous@healonline.test',
		day: 1,
		hour: 14,
		minute: 30,
		symptoms: 'Температура 38.6 від учорашнього вечора, ломота в тілі.',
		triage: { complaint: 'high_fever', severity: 7, durationHours: 8, redFlags: [] },
	},
	{
		patient: 'bohdan.rudenko@healonline.test',
		day: 1,
		hour: 15,
		symptoms: 'Задишка під час ходьби, є гіпертензія, почалось сьогодні.',
		triage: { complaint: 'breathing', severity: 6, durationHours: 3, redFlags: [] },
	},
	{
		patient: 'dmytro.ostapenko@healonline.test',
		day: 1,
		hour: 15,
		minute: 30,
		symptoms: 'Тиск у грудях після підйому сходами, триває кілька годин.',
		triage: { complaint: 'chest_pain', severity: 5, durationHours: 12, redFlags: [] },
	},
	{
		patient: 'anna.petrenko@healonline.test',
		day: 1,
		hour: 16,
		symptoms: 'Тиснучий біль у грудях, віддає в ліву руку, менше години.',
		triage: {
			complaint: 'chest_pain',
			severity: 8,
			durationHours: 2,
			redFlags: ['radiating_pain'],
		},
	},
	{
		patient: 'maksym.koval@healonline.test',
		day: 1,
		hour: 16,
		minute: 30,
		symptoms: 'Кров з носа, зупинилась, але повторюється сьогодні.',
		triage: { complaint: 'bleeding', severity: 4, durationHours: 2, redFlags: [] },
	},
	{
		patient: 'sofia.marchuk@healonline.test',
		day: 1,
		hour: 17,
		symptoms: 'Тривога і поганий сон кілька днів, паніки зараз немає.',
		triage: { complaint: 'mental', severity: 5, durationHours: 24, redFlags: [] },
		consultationType: 'Voice Call',
	},
	{
		patient: 'iryna.bilous@healonline.test',
		day: 1,
		hour: 17,
		minute: 30,
		symptoms: 'Першіння в горлі три дні, температури немає.',
		triage: { complaint: 'cold', severity: 4, durationHours: 72, redFlags: [] },
	},
	{
		patient: 'bohdan.rudenko@healonline.test',
		day: 2,
		hour: 9,
		symptoms: 'Сильний біль у грудях з віддачею в щелепу, є гіпертензія.',
		triage: {
			complaint: 'chest_pain',
			severity: 9,
			durationHours: 1,
			redFlags: ['radiating_pain'],
		},
	},
	{
		patient: 'dmytro.ostapenko@healonline.test',
		day: 2,
		hour: 9,
		minute: 30,
		symptoms: 'Раптово погано орієнтувався, близькі кажуть про сплутаність.',
		triage: {
			complaint: 'consciousness',
			severity: 7,
			durationHours: 2,
			redFlags: ['confusion'],
		},
	},
	{
		patient: 'anna.petrenko@healonline.test',
		day: 2,
		hour: 10,
		symptoms: 'Температура 39 зранку, сильний озноб.',
		triage: { complaint: 'high_fever', severity: 8, durationHours: 4, redFlags: [] },
	},
	{
		patient: 'maksym.koval@healonline.test',
		day: 2,
		hour: 10,
		minute: 30,
		symptoms: 'Старий біль у попереку, сьогодні трохи сильніший.',
		triage: { complaint: 'injury', severity: 3, durationHours: 400, redFlags: [] },
	},
	{
		patient: 'sofia.marchuk@healonline.test',
		day: 2,
		hour: 11,
		symptoms: 'Набряк губ після горіхів, важче ковтати.',
		triage: {
			complaint: 'allergy',
			severity: 8,
			durationHours: 2,
			redFlags: ['swelling_throat'],
		},
	},
	{
		patient: 'iryna.bilous@healonline.test',
		day: 2,
		hour: 11,
		minute: 30,
		symptoms: 'Задишка при швидкій ходьбі від учора.',
		triage: { complaint: 'breathing', severity: 4, durationHours: 20, redFlags: [] },
	},
	{
		patient: 'bohdan.rudenko@healonline.test',
		day: 2,
		hour: 12,
		symptoms: 'Дискомфорт у животі три дні, апетит збережений.',
		triage: { complaint: 'abdominal', severity: 3, durationHours: 72, redFlags: [] },
	},
	{
		patient: 'dmytro.ostapenko@healonline.test',
		day: 2,
		hour: 14,
		symptoms: 'Легка закладеність носа понад два тижні.',
		triage: { complaint: 'cold', severity: 2, durationHours: 400, redFlags: [] },
	},
]

async function main() {
	await mongoose.connect(process.env.MONGO_URL)
	const doctor = await Doctor.findOne({ email: DOCTOR_EMAIL })
	if (!doctor) {
		throw new Error('Не знайдено демо-лікаря. Спочатку запустіть seed.js')
	}

	const patients = await Patient.find({
		email: { $in: [...new Set(examples.map(item => item.patient))] },
	})
	const byEmail = new Map(patients.map(item => [item.email, item]))
	for (const example of examples) {
		if (!byEmail.has(example.patient)) {
			throw new Error(`Не знайдено пацієнта ${example.patient}`)
		}
	}

	await Appointment.deleteMany({
		doctorId: doctor._id,
		symptoms: new RegExp(`^${MARK}`),
	})

	const created = []
	for (const [index, example] of examples.entries()) {
		const patient = byEmail.get(example.patient)
		const start = atSlot(example.day, example.hour, example.minute || 0)
		const end = new Date(start.getTime() + 30 * 60 * 1000)
		const input = triageFromContext(
			{ ...example.triage, hasChronicCondition: false },
			patient
		)
		const priority = prioritizeAppeal(input)
		const appointment = await Appointment.create({
			doctorId: doctor._id,
			patientId: patient._id,
			date: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
			slotStartIso: start,
			slotEndIso: end,
			consultationType: example.consultationType || 'Video Consultation',
			status: 'Scheduled',
			symptoms: `${MARK} ${example.symptoms}`,
			triage: input,
			consultationFees: doctor.fees || 500,
			platformFees: Math.round((doctor.fees || 500) * 0.1),
			totalAmount: (doctor.fees || 500) + Math.round((doctor.fees || 500) * 0.1),
			paymentStatus: 'Paid',
			priorityScore: priority.score,
			priorityLevel: priority.level,
			priorityLabel: priority.levelLabel,
			priorityReasons: priority.reasons,
			systemPriorityScore: priority.score,
			systemPriorityLevel: priority.level,
			systemPriorityLabel: priority.levelLabel,
			systemPriorityReasons: priority.reasons,
			priorityHistory: [
				{
					toLevel: priority.level,
					toLabel: priority.levelLabel,
					toScore: priority.score,
					reason: 'Початкова оцінка за правилами системи',
					actor: 'system',
					actorName: 'Система',
					at: new Date(),
				},
			],
			zegoRoomId: `room_demo_${index + 1}`,
		})

		if (example.override) {
			const next = doctorPriority(example.override.level)
			appointment.priorityHistory.push({
				fromLevel: appointment.priorityLevel,
				fromLabel: appointment.priorityLabel,
				fromScore: appointment.priorityScore,
				toLevel: next.level,
				toLabel: next.levelLabel,
				toScore: next.score,
				reason: example.override.reason,
				actor: 'doctor',
				actorName: doctor.name,
				at: new Date(),
			})
			appointment.priorityOverridden = true
			appointment.priorityOverrideReason = example.override.reason
			appointment.priorityOverriddenAt = new Date()
			appointment.priorityLevel = next.level
			appointment.priorityLabel = next.levelLabel
			appointment.priorityScore = next.score
			await appointment.save()
		}

		created.push(appointment)
	}

	const populated = await Appointment.find({
		_id: { $in: created.map(item => item._id) },
	})
		.populate('doctorId', 'name specialization')
		.populate('patientId', 'name age')

	const byTime = [...populated].sort(
		(a, b) => new Date(a.slotStartIso) - new Date(b.slotStartIso)
	)
	const byPriority = sortQueue(populated)
	const rank = { emergency: 4, urgent: 3, planned: 2, routine: 1 }
	const delayed = byTime.filter((item, index) => {
		if (item.priorityLevel !== 'emergency' && item.priorityLevel !== 'urgent') {
			return false
		}
		return byTime
			.slice(0, index)
			.some(previous => (rank[previous.priorityLevel] || 0) < (rank[item.priorityLevel] || 0))
	}).length

	const counts = byPriority.reduce((acc, item) => {
		acc[item.priorityLabel] = (acc[item.priorityLabel] || 0) + 1
		return acc
	}, {})

	console.log(`Лікар: ${doctor.name} (${doctor.email})`)
	console.log(`Записів: ${populated.length}`)
	console.log('За рівнями:', counts)
	console.log(
		`Невідкладних і термінових, перед якими за часом стоїть легше звернення: ${delayed}`
	)
	console.log('\nЧерга за пріоритетом:')
	byPriority.forEach((item, index) => {
		console.log(
			`${index + 1}. ${item.priorityLabel} (${item.priorityScore}) | ${item.patientId?.name} | ${item.symptoms.replace(MARK, '').trim()}`
		)
	})

	await mongoose.disconnect()
}

main().catch(error => {
	console.error(error)
	process.exit(1)
})
