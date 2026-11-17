/**
 * Прозора модель пріоритету медичного звернення.
 * Додає бали за правила і пояснює кожне з них.
 * Це підказка для черги, не діагноз і не заміна огляду лікаря.
 */

const COMPLAINTS = {
	chest_pain: { label: 'Біль у грудях', base: 45 },
	breathing: { label: 'Задишка', base: 45 },
	consciousness: { label: 'Порушення свідомості', base: 55 },
	bleeding: { label: 'Кровотеча', base: 40 },
	allergy: { label: 'Алергічна реакція', base: 30 },
	high_fever: { label: 'Висока температура', base: 25 },
	abdominal: { label: 'Біль у животі', base: 22 },
	injury: { label: 'Травма', base: 20 },
	mental: { label: 'Психічний стан', base: 18 },
	skin: { label: 'Шкіра', base: 8 },
	cold: { label: 'Застуда', base: 6 },
	other: { label: 'Інше', base: 10 },
}

const RED_FLAGS = {
	radiating_pain: {
		label: 'Біль віддає в руку, щелепу або спину',
		points: 20,
		complaints: ['chest_pain', 'injury'],
	},
	breath_at_rest: {
		label: 'Задишка у спокої',
		points: 20,
		complaints: ['chest_pain', 'breathing', 'allergy', 'cold'],
	},
	fainting: {
		label: 'Втрата свідомості',
		points: 25,
		force: 'emergency',
		complaints: [
			'chest_pain',
			'breathing',
			'consciousness',
			'bleeding',
			'high_fever',
			'abdominal',
			'injury',
			'other',
		],
	},
	uncontrolled_bleeding: {
		label: 'Кровотеча, яку не вдається зупинити',
		points: 25,
		force: 'emergency',
		complaints: ['bleeding', 'injury', 'abdominal', 'other'],
	},
	swelling_throat: {
		label: 'Набряк обличчя або горла',
		points: 25,
		force: 'emergency',
		complaints: ['allergy', 'breathing', 'skin', 'other'],
	},
	blue_lips: {
		label: 'Посиніння губ',
		points: 25,
		force: 'emergency',
		complaints: ['chest_pain', 'breathing', 'consciousness', 'allergy'],
	},
	confusion: {
		label: 'Сплутаність свідомості',
		points: 25,
		force: 'emergency',
		complaints: ['consciousness', 'high_fever', 'injury', 'mental', 'other'],
	},
	suicidal: {
		label: 'Думки про самопошкодження',
		points: 25,
		force: 'emergency',
		complaints: ['mental', 'other'],
	},
	pregnancy_bleeding: {
		label: 'Кровотеча під час вагітності',
		points: 25,
		force: 'emergency',
		complaints: ['bleeding', 'abdominal'],
	},
	infant_fever: {
		label: 'Дитина до 3 років із високою температурою',
		points: 15,
		complaints: ['high_fever', 'cold'],
	},
	cold_sweat: {
		label: 'Холодний піт разом із різкою слабкістю',
		points: 20,
		complaints: ['chest_pain', 'breathing'],
	},
	cannot_speak: {
		label: 'Важко говорити повними реченнями через нестачу повітря',
		points: 20,
		complaints: ['chest_pain', 'breathing', 'allergy'],
	},
	coughing_blood: {
		label: 'Кровохаркання',
		points: 25,
		force: 'emergency',
		complaints: ['breathing', 'cold'],
	},
	cannot_swallow: {
		label: 'Не можу ковтати навіть слину',
		points: 20,
		complaints: ['cold', 'allergy', 'breathing'],
	},
	seizure: {
		label: 'Судоми',
		points: 25,
		force: 'emergency',
		complaints: ['consciousness', 'high_fever', 'injury', 'other'],
	},
	one_sided_weakness: {
		label: 'Раптова слабкість або оніміння з одного боку, порушення мовлення',
		points: 25,
		force: 'emergency',
		complaints: ['consciousness', 'other'],
	},
	vomiting_blood: {
		label: 'Блювання кров’ю',
		points: 25,
		force: 'emergency',
		complaints: ['bleeding', 'abdominal', 'other'],
	},
	black_stool: {
		label: 'Чорний стілець, схожий на дьоготь',
		points: 20,
		complaints: ['bleeding', 'abdominal'],
	},
	spreading_hives: {
		label: 'Кропив’янка швидко поширюється по тілу',
		points: 15,
		complaints: ['allergy', 'skin'],
	},
	stiff_neck_fever: {
		label: 'Сильний головний біль і напружена шия разом із температурою',
		points: 25,
		force: 'emergency',
		complaints: ['high_fever'],
	},
	persistent_vomit: {
		label: 'Блювання не припиняється',
		points: 15,
		complaints: ['abdominal', 'high_fever', 'injury'],
	},
	rigid_abdomen: {
		label: 'Живіт дуже болить від дотику',
		points: 20,
		complaints: ['abdominal'],
	},
	limb_unusable: {
		label: 'Кінцівка не рухається або рана глибока',
		points: 20,
		complaints: ['injury'],
	},
	head_injury_vomit: {
		label: 'Після удару голови є блювання або сильний головний біль',
		points: 25,
		force: 'emergency',
		complaints: ['injury', 'consciousness'],
	},
	spreading_redness: {
		label: 'Почервоніння швидко розходиться, шкіра гаряча і болить',
		points: 15,
		complaints: ['skin'],
	},
	dangerous_behavior: {
		label: 'Поведінка небезпечна для мене або людей поруч',
		points: 25,
		force: 'emergency',
		complaints: ['mental', 'other'],
	},
}

const LEVELS = [
	{ id: 'emergency', min: 75, label: 'Невідкладно' },
	{ id: 'urgent', min: 45, label: 'Терміново' },
	{ id: 'planned', min: 20, label: 'Планово' },
	{ id: 'routine', min: 0, label: 'Може зачекати' },
]

const DISCLAIMER =
	'Система лише впорядковує чергу. Вона не ставить діагноз і не замінює лікаря. За загрозливих ознак зверніться до екстреної допомоги.'

const EMERGENCY_NOTICE =
	'Рівень «Невідкладно» лише піднімає звернення в черзі. Це не виклик екстреної допомоги. Якщо є загроза життю, телефонуйте 103.'

const SPECIALTY_RULES = [
	{
		specialization: 'Cardiologist',
		label: 'Кардіолог',
		complaints: ['chest_pain'],
		flags: ['radiating_pain', 'cold_sweat'],
		note: 'Серцева скарга стоїть вище в черзі кардіолога',
	},
	{
		specialization: 'Pediatrician',
		label: 'Педіатр',
		ageUnder: 18,
		flags: ['infant_fever'],
		note: 'Дитяче звернення стоїть вище в черзі педіатра',
	},
	{
		specialization: 'Dermatologist',
		label: 'Дерматолог',
		complaints: ['skin', 'allergy'],
		note: 'Шкірна скарга стоїть вище в черзі дерматолога',
	},
	{
		specialization: 'Neurologist',
		label: 'Невролог',
		complaints: ['consciousness'],
		flags: ['confusion', 'fainting', 'one_sided_weakness', 'seizure'],
		note: 'Неврологічна ознака стоїть вище в черзі невролога',
	},
	{
		specialization: 'Psychiatrist',
		label: 'Психіатр',
		complaints: ['mental'],
		flags: ['suicidal'],
		note: 'Звернення про психічний стан стоїть вище в черзі психіатра',
	},
	{
		specialization: 'Orthopedic',
		label: 'Ортопед',
		complaints: ['injury'],
		note: 'Травма стоїть вище в черзі ортопеда',
	},
	{
		specialization: 'Gynecologist',
		label: 'Гінеколог',
		flags: ['pregnancy_bleeding'],
		note: 'Акушерська ознака стоїть вище в черзі гінеколога',
	},
	{
		specialization: 'ENT Specialist',
		label: 'ЛОР',
		complaints: ['cold', 'breathing'],
		note: 'Скарга ЛОР-профілю стоїть вище в черзі цього лікаря',
	},
	{
		specialization: 'General Physician',
		label: 'Сімейний лікар',
		complaints: ['cold', 'high_fever', 'abdominal', 'other'],
		note: 'Загальна скарга стоїть вище в черзі сімейного лікаря',
	},
	{
		specialization: 'Ophthalmologist',
		label: 'Офтальмолог',
		complaints: [],
		note: '',
	},
]

const LEVEL_SCORE = {
	emergency: 90,
	urgent: 60,
	planned: 30,
	routine: 10,
}

const levelByScore = score => LEVELS.find(level => score >= level.min) || LEVELS[3]

function doctorPriority(level) {
	const found = LEVELS.find(item => item.id === level)
	if (!found) return null
	return {
		level: found.id,
		levelLabel: found.label,
		score: LEVEL_SCORE[found.id],
	}
}

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

function prioritizeAppeal(input = {}) {
	const complaint = COMPLAINTS[input.complaint]
	if (!complaint) {
		return {
			score: 0,
			level: 'routine',
			levelLabel: 'Може зачекати',
			reasons: [
				'Недостатньо структурованих даних. Звернення стоїть у кінці черги.',
			],
			disclaimer: DISCLAIMER,
			emergencyNotice: EMERGENCY_NOTICE,
		}
	}

	const reasons = []
	let score = complaint.base
	reasons.push(`Категорія «${complaint.label}»: +${complaint.base}`)

	const severity = clamp(Number(input.severity) || 1, 1, 10)
	const severityPoints = severity * 3
	score += severityPoints
	reasons.push(`Сила симптому ${severity}/10: +${severityPoints}`)

	const durationHours = Number(input.durationHours)
	if (Number.isFinite(durationHours) && durationHours >= 0) {
		if (durationHours <= 6 && complaint.base >= 25) {
			score += 10
			reasons.push('Гострий початок потенційно небезпечної скарги: +10')
		} else if (durationHours >= 336 && severity <= 3 && complaint.base <= 15) {
			score -= 8
			reasons.push('Тривалий легкий перебіг: −8')
		}
	}

	const flags = (Array.isArray(input.redFlags) ? input.redFlags : []).filter(
		flagId => {
			const flag = RED_FLAGS[flagId]
			return flag && (flag.complaints || []).includes(input.complaint)
		}
	)
	let forcedEmergency = false
	for (const flagId of flags) {
		const flag = RED_FLAGS[flagId]
		if (!flag) continue
		score += flag.points
		reasons.push(`Червона ознака «${flag.label}»: +${flag.points}`)
		if (flag.force === 'emergency') forcedEmergency = true
	}

	const age = Number(input.age)
	if (Number.isFinite(age) && (age >= 65 || age < 3)) {
		score += 12
		reasons.push(
			age < 3
				? 'Вік до 3 років підвищує пріоритет: +12'
				: 'Вік від 65 років підвищує пріоритет: +12'
		)
	}

	if (input.hasChronicCondition) {
		score += 8
		reasons.push('Є хронічне захворювання: +8')
	}

	score = clamp(score, 0, 100)

	if (forcedEmergency && score < 75) {
		score = 75
		reasons.push(
			'Правило червоної ознаки піднімає звернення до рівня «Невідкладно».'
		)
	}

	const level = levelByScore(score)
	return {
		score,
		level: level.id,
		levelLabel: level.label,
		reasons,
		disclaimer: DISCLAIMER,
		emergencyNotice: EMERGENCY_NOTICE,
	}
}

function triageFromContext(triage = {}, patient) {
	const chronicText = patient?.medicalHistory?.chronicConditions || ''
	const profileChronic =
		chronicText.trim().length > 0 && !/^немає$/i.test(chronicText.trim())

	return {
		complaint: triage.complaint,
		severity: triage.severity,
		durationHours: triage.durationHours,
		redFlags: Array.isArray(triage.redFlags) ? triage.redFlags : [],
		age: Number.isFinite(Number(patient?.age)) ? Number(patient.age) : null,
		hasChronicCondition: Boolean(triage.hasChronicCondition) || profileChronic,
	}
}

const TEXT_COMPLAINTS = [
	{ id: 'chest_pain', words: ['груд', 'сердц', 'стиска'] },
	{ id: 'breathing', words: ['задиш', 'ядух', 'не можу диха'] },
	{ id: 'consciousness', words: ['непритом', 'свідом', 'судом', 'онімін'] },
	{ id: 'bleeding', words: ['кровотеч', 'кров'] },
	{ id: 'allergy', words: ['алерг', 'кропив', 'набряк'] },
	{ id: 'high_fever', words: ['температ', 'гаряч', 'озноб'] },
	{ id: 'abdominal', words: ['живот', 'нудот'] },
	{ id: 'injury', words: ['травм', 'забій', 'перелом', 'удар'] },
	{ id: 'mental', words: ['тривог', 'паніч', 'депрес', 'безсон'] },
	{ id: 'skin', words: ['шкір', 'висип', 'сверб'] },
	{ id: 'cold', words: ['застуд', 'нежит', 'горл', 'кашел'] },
]

function guessComplaint(text) {
	const value = String(text || '').toLowerCase()
	const hits = TEXT_COMPLAINTS.filter(item =>
		item.words.some(word => value.includes(word))
	)
	if (!hits.length) return ''
	hits.sort((a, b) => (COMPLAINTS[b.id]?.base || 0) - (COMPLAINTS[a.id]?.base || 0))
	return hits[0].id
}

function recommendCare(input = {}) {
	const explicit = COMPLAINTS[input.complaint] ? input.complaint : ''
	const complaint = explicit || guessComplaint(input.text) || 'other'
	const redFlags = Array.isArray(input.redFlags) ? input.redFlags : []
	const text = String(input.text || '').toLowerCase()
	if (text.includes('вагіт') && text.includes('кров')) {
		if (!redFlags.includes('pregnancy_bleeding')) redFlags.push('pregnancy_bleeding')
	}
	if (text.includes('самопошкод') || text.includes('суїцид') || text.includes('не хочу жити')) {
		if (!redFlags.includes('suicidal')) redFlags.push('suicidal')
	}

	const priority = prioritizeAppeal({
		complaint,
		severity: 5,
		durationHours: 12,
		redFlags,
		age: null,
		hasChronicCondition: false,
	})

	const specialties = SPECIALTY_RULES.filter(rule => {
		const complaintHit = (rule.complaints || []).includes(complaint)
		const flagHit = (rule.flags || []).some(flag => redFlags.includes(flag))
		return complaintHit || flagHit
	})
		.map(rule => ({
			specialization: rule.specialization,
			label: rule.label,
		}))
		.sort((a, b) => {
			if (a.specialization === 'General Physician') return 1
			if (b.specialization === 'General Physician') return -1
			return 0
		})

	const primary = specialties[0]
	const where =
		priority.level === 'emergency'
			? {
					title: 'Спочатку телефонуйте 103',
					text: 'Опис схожий на невідкладний стан. Після виклику екстреної допомоги можна звернутися до рекомендованого лікаря.',
			  }
			: primary
				? {
						title: `Краще звернутися до лікаря: ${primary.label}`,
						text: 'Це підказка за скаргою, не діагноз. Запис відкриється після реєстрації.',
				  }
				: {
						title: 'Краще почати з сімейного лікаря',
						text: 'За цим описом вузький спеціаліст не очевидний. Сімейний лікар підкаже, чи потрібен інший профіль.',
				  }

	return {
		complaint,
		complaintLabel: COMPLAINTS[complaint]?.label || 'Інше',
		guessed: !explicit,
		priority: {
			level: priority.level,
			levelLabel: priority.levelLabel,
			score: priority.score,
			emergencyNotice: priority.emergencyNotice,
			disclaimer: priority.disclaimer,
		},
		where,
		specialties: specialties.length
			? specialties
			: [{ specialization: 'General Physician', label: 'Сімейний лікар' }],
	}
}

function specialtyMatch(specialization, input = {}) {
	const rule = SPECIALTY_RULES.find(item => item.specialization === specialization)
	if (!rule) return { match: false, note: '' }

	const age = Number(input.age)
	const flags = Array.isArray(input.redFlags) ? input.redFlags : []
	const ageHit =
		Number.isFinite(rule.ageUnder) && Number.isFinite(age) && age < rule.ageUnder
	const complaintHit = (rule.complaints || []).includes(input.complaint)
	const flagHit = (rule.flags || []).some(flag => flags.includes(flag))
	const match = Boolean(ageHit || complaintHit || flagHit)

	return { match, note: match ? rule.note : '' }
}

function withSpecialty(appointment) {
	const plain = appointment.toObject ? appointment.toObject() : { ...appointment }
	const match = specialtyMatch(plain.doctorId?.specialization, {
		complaint: plain.triage?.complaint,
		age: plain.patientId?.age,
		redFlags: plain.triage?.redFlags || [],
	})
	plain.specialtyMatch = match.match
	plain.specialtyNote = match.note
	return plain
}

function sortQueue(appointments) {
	const rank = { emergency: 4, urgent: 3, planned: 2, routine: 1 }
	const startOfToday = new Date()
	startOfToday.setHours(0, 0, 0, 0)
	return appointments.map(withSpecialty).sort((a, b) => {
		const aOld = new Date(a.slotStartIso) < startOfToday
		const bOld = new Date(b.slotStartIso) < startOfToday
		if (aOld !== bOld) return aOld ? 1 : -1
		const byLevel = (rank[b.priorityLevel] || 0) - (rank[a.priorityLevel] || 0)
		if (byLevel) return byLevel
		const bySpecialty = Number(Boolean(b.specialtyMatch)) - Number(Boolean(a.specialtyMatch))
		if (bySpecialty) return bySpecialty
		const byScore = (b.priorityScore || 0) - (a.priorityScore || 0)
		if (byScore) return byScore
		return new Date(a.slotStartIso) - new Date(b.slotStartIso)
	})
}

function rulesCatalog() {
	const shared = {
		complaint: 'chest_pain',
		severity: 5,
		durationHours: 2,
		hasChronicCondition: false,
	}
	const comparisons = [
		{
			title: '30 років, без червоних ознак',
			input: { ...shared, age: 30, redFlags: [] },
		},
		{
			title: '70 років, без червоних ознак',
			input: { ...shared, age: 70, redFlags: [] },
		},
		{
			title: '30 років, біль віддає в руку',
			input: { ...shared, age: 30, redFlags: ['radiating_pain'] },
		},
	].map(item => ({
		title: item.title,
		input: item.input,
		result: prioritizeAppeal(item.input),
	}))

	return {
		disclaimer: DISCLAIMER,
		emergencyNotice: EMERGENCY_NOTICE,
		levels: LEVELS,
		severity: {
			perPoint: 3,
			scale: '1–10',
			text: 'Кожен бал сили симптому додає 3 бали до пріоритету.',
		},
		age: {
			seniorFrom: 65,
			childUnder: 3,
			points: 12,
			text: 'Вік до 3 років або від 65 років додає 12 балів.',
		},
		chronic: {
			points: 8,
			text: 'Хронічне захворювання додає 8 балів.',
		},
		acute: {
			withinHours: 6,
			points: 10,
			text: 'Небезпечна скарга, що триває до 6 годин, додає 10 балів.',
		},
		prolonged: {
			afterHours: 336,
			points: -8,
			text: 'Легка скарга довше ніж 2 тижні зменшує пріоритет на 8 балів.',
		},
		complaints: Object.entries(COMPLAINTS).map(([id, value]) => ({
			id,
			label: value.label,
			points: value.base,
		})),
		redFlags: Object.entries(RED_FLAGS).map(([id, value]) => ({
			id,
			label: value.label,
			points: value.points,
			forcesEmergency: value.force === 'emergency',
			complaints: value.complaints,
			complaintLabels: value.complaints.map(
				complaintId => COMPLAINTS[complaintId]?.label || complaintId
			),
		})),
		specialties: SPECIALTY_RULES.filter(rule => rule.note).map(rule => ({
			label: rule.label,
			note: rule.note,
		})),
		comparisons,
	}
}

module.exports = {
	COMPLAINTS,
	RED_FLAGS,
	EMERGENCY_NOTICE,
	prioritizeAppeal,
	recommendCare,
	triageFromContext,
	doctorPriority,
	specialtyMatch,
	sortQueue,
	rulesCatalog,
}
