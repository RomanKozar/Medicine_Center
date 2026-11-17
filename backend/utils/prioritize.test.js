const test = require('node:test')
const assert = require('node:assert/strict')
const { prioritizeAppeal, recommendCare } = require('./prioritize')

test('однакові дані дають той самий пріоритет', () => {
	const input = {
		complaint: 'abdominal',
		severity: 6,
		durationHours: 20,
		redFlags: [],
		age: 34,
		hasChronicCondition: false,
	}
	assert.deepEqual(prioritizeAppeal(input), prioritizeAppeal(input))
})

test('біль у грудях із віддачею і віком 70 є невідкладним', () => {
	const result = prioritizeAppeal({
		complaint: 'chest_pain',
		severity: 8,
		durationHours: 2,
		redFlags: ['radiating_pain'],
		age: 70,
		hasChronicCondition: true,
	})
	assert.equal(result.level, 'emergency')
	assert.ok(result.score >= 75)
	assert.ok(result.reasons.some(reason => reason.includes('Біль у грудях')))
	assert.ok(result.reasons.some(reason => reason.includes('віддає')))
	assert.ok(result.reasons.some(reason => reason.includes('65')))
})

test('легка тривала застуда лишається низьким пріоритетом', () => {
	const result = prioritizeAppeal({
		complaint: 'cold',
		severity: 2,
		durationHours: 400,
		redFlags: [],
		age: 28,
		hasChronicCondition: false,
	})
	assert.equal(result.level, 'routine')
	assert.ok(result.reasons.some(reason => reason.includes('−8')))
})

test('червона ознака самопошкодження піднімає психічну скаргу', () => {
	const result = prioritizeAppeal({
		complaint: 'mental',
		severity: 2,
		durationHours: 48,
		redFlags: ['suicidal'],
		age: 30,
	})
	assert.equal(result.level, 'emergency')
	assert.ok(result.score >= 75)
})

test('тривожна ознака іншої категорії не змінює бал', () => {
	const plain = prioritizeAppeal({
		complaint: 'cold',
		severity: 2,
		durationHours: 48,
		redFlags: [],
		age: 30,
	})
	const mismatched = prioritizeAppeal({
		complaint: 'cold',
		severity: 2,
		durationHours: 48,
		redFlags: ['suicidal', 'radiating_pain'],
		age: 30,
	})
	assert.equal(mismatched.score, plain.score)
	assert.equal(mismatched.level, plain.level)
})

test('рішення лікаря має фіксований бал для сортування черги', () => {
	const { doctorPriority } = require('./prioritize')
	assert.equal(doctorPriority('emergency').score, 90)
	assert.equal(doctorPriority('routine').levelLabel, 'Може зачекати')
	assert.equal(doctorPriority('unknown'), null)
})

test('вік і червона ознака змінюють бал за тієї самої скарги', () => {
	const younger = prioritizeAppeal({
		complaint: 'chest_pain',
		severity: 8,
		durationHours: 2,
		redFlags: [],
		age: 30,
	})
	const older = prioritizeAppeal({
		complaint: 'chest_pain',
		severity: 8,
		durationHours: 2,
		redFlags: [],
		age: 70,
	})
	const flagged = prioritizeAppeal({
		complaint: 'chest_pain',
		severity: 8,
		durationHours: 2,
		redFlags: ['radiating_pain'],
		age: 30,
	})
	assert.ok(older.score > younger.score)
	assert.ok(flagged.score > younger.score)
})

test('спеціалізація піднімає звернення лише всередині рівня', () => {
	const { specialtyMatch, sortQueue } = require('./prioritize')
	assert.equal(
		specialtyMatch('Cardiologist', { complaint: 'chest_pain', age: 40, redFlags: [] }).match,
		true
	)
	assert.equal(
		specialtyMatch('Cardiologist', { complaint: 'cold', age: 40, redFlags: [] }).match,
		false
	)
	assert.equal(
		specialtyMatch('Pediatrician', { complaint: 'cold', age: 6, redFlags: [] }).match,
		true
	)

	const queue = sortQueue([
		{
			priorityLevel: 'urgent',
			priorityScore: 60,
			slotStartIso: '2026-12-01T09:00:00.000Z',
			triage: { complaint: 'cold', redFlags: [] },
			patientId: { age: 40 },
			doctorId: { specialization: 'Cardiologist' },
		},
		{
			priorityLevel: 'urgent',
			priorityScore: 50,
			slotStartIso: '2026-12-01T10:00:00.000Z',
			triage: { complaint: 'chest_pain', redFlags: [] },
			patientId: { age: 40 },
			doctorId: { specialization: 'Cardiologist' },
		},
		{
			priorityLevel: 'emergency',
			priorityScore: 80,
			slotStartIso: '2026-12-01T11:00:00.000Z',
			triage: { complaint: 'cold', redFlags: [] },
			patientId: { age: 40 },
			doctorId: { specialization: 'Cardiologist' },
		},
	])
	assert.equal(queue[0].priorityLevel, 'emergency')
	assert.equal(queue[1].triage.complaint, 'chest_pain')
	assert.equal(queue[1].specialtyMatch, true)
	assert.equal(queue[2].triage.complaint, 'cold')
})

test('запис за минулу дату йде після сьогоднішніх і майбутніх', () => {
	const { sortQueue } = require('./prioritize')
	const future = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
	const past = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
	const queue = sortQueue([
		{
			priorityLevel: 'urgent',
			priorityScore: 60,
			slotStartIso: past,
			triage: { complaint: 'cold', redFlags: [] },
			patientId: { age: 30 },
			doctorId: { specialization: 'General Physician' },
		},
		{
			priorityLevel: 'routine',
			priorityScore: 4,
			slotStartIso: future,
			triage: { complaint: 'cold', redFlags: [] },
			patientId: { age: 30 },
			doctorId: { specialization: 'General Physician' },
		},
	])
	assert.equal(queue[0].priorityScore, 4)
	assert.equal(queue[1].priorityScore, 60)
})

test('вільний опис болю в грудях веде до кардіолога', () => {
	const advice = recommendCare({ text: 'Стискає в грудях і важко дихати' })
	assert.equal(advice.complaint, 'chest_pain')
	assert.equal(advice.specialties[0].specialization, 'Cardiologist')
	assert.equal(advice.guessed, true)
})

test('застуда радить лора і лишає сімейного лікаря далі', () => {
	const advice = recommendCare({ text: 'Другий день болить горло і нежить' })
	assert.equal(advice.complaint, 'cold')
	assert.equal(advice.specialties[0].specialization, 'ENT Specialist')
	assert.equal(
		advice.specialties.at(-1).specialization,
		'General Physician'
	)
})

test('без категорії звернення йде в кінець черги', () => {
	const result = prioritizeAppeal({})
	assert.equal(result.level, 'routine')
	assert.equal(result.score, 0)
})
