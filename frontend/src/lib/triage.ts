export interface TriageInput {
	complaint: string
	severity: number
	durationHours: number
	redFlags: string[]
	hasChronicCondition: boolean
}

export interface PriorityResult {
	score: number
	level: 'emergency' | 'urgent' | 'planned' | 'routine' | string
	levelLabel: string
	reasons: string[]
	disclaimer?: string
}

export const emptyTriage: TriageInput = {
	complaint: '',
	severity: 5,
	durationHours: 12,
	redFlags: [],
	hasChronicCondition: false,
}

export const complaintOptions = [
	{ id: 'chest_pain', label: 'Біль у грудях' },
	{ id: 'breathing', label: 'Задишка' },
	{ id: 'consciousness', label: 'Порушення свідомості' },
	{ id: 'bleeding', label: 'Кровотеча' },
	{ id: 'allergy', label: 'Алергічна реакція' },
	{ id: 'high_fever', label: 'Висока температура' },
	{ id: 'abdominal', label: 'Біль у животі' },
	{ id: 'injury', label: 'Травма' },
	{ id: 'mental', label: 'Психічний стан' },
	{ id: 'skin', label: 'Шкіра' },
	{ id: 'cold', label: 'Застуда' },
	{ id: 'other', label: 'Інше' },
]

export const durationOptions = [
	{ hours: 2, label: 'До 6 годин' },
	{ hours: 12, label: 'Від 6 до 24 годин' },
	{ hours: 48, label: '1–3 дні' },
	{ hours: 120, label: 'Більше 3 днів' },
	{ hours: 400, label: 'Більше 2 тижнів' },
]

export const redFlagOptions = [
	{
		id: 'radiating_pain',
		label: 'Біль віддає в руку, щелепу або спину',
		complaints: ['chest_pain', 'injury'],
	},
	{
		id: 'breath_at_rest',
		label: 'Задишка у спокої',
		complaints: ['chest_pain', 'breathing', 'allergy', 'cold'],
	},
	{
		id: 'fainting',
		label: 'Втрата свідомості',
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
	{
		id: 'uncontrolled_bleeding',
		label: 'Кровотеча, яку не вдається зупинити',
		complaints: ['bleeding', 'injury', 'abdominal', 'other'],
	},
	{
		id: 'swelling_throat',
		label: 'Набряк обличчя або горла',
		complaints: ['allergy', 'breathing', 'skin', 'other'],
	},
	{
		id: 'blue_lips',
		label: 'Посиніння губ',
		complaints: ['chest_pain', 'breathing', 'consciousness', 'allergy'],
	},
	{
		id: 'confusion',
		label: 'Сплутаність свідомості',
		complaints: ['consciousness', 'high_fever', 'injury', 'mental', 'other'],
	},
	{
		id: 'suicidal',
		label: 'Думки про самопошкодження',
		complaints: ['mental', 'other'],
	},
	{
		id: 'pregnancy_bleeding',
		label: 'Кровотеча під час вагітності',
		complaints: ['bleeding', 'abdominal'],
	},
	{
		id: 'infant_fever',
		label: 'Дитина до 3 років із високою температурою',
		complaints: ['high_fever', 'cold'],
	},
	{
		id: 'cold_sweat',
		label: 'Холодний піт разом із різкою слабкістю',
		complaints: ['chest_pain', 'breathing'],
	},
	{
		id: 'cannot_speak',
		label: 'Важко говорити повними реченнями через нестачу повітря',
		complaints: ['chest_pain', 'breathing', 'allergy'],
	},
	{
		id: 'coughing_blood',
		label: 'Кровохаркання',
		complaints: ['breathing', 'cold'],
	},
	{
		id: 'cannot_swallow',
		label: 'Не можу ковтати навіть слину',
		complaints: ['cold', 'allergy', 'breathing'],
	},
	{
		id: 'seizure',
		label: 'Судоми',
		complaints: ['consciousness', 'high_fever', 'injury', 'other'],
	},
	{
		id: 'one_sided_weakness',
		label: 'Раптова слабкість або оніміння з одного боку, порушення мовлення',
		complaints: ['consciousness', 'other'],
	},
	{
		id: 'vomiting_blood',
		label: 'Блювання кров’ю',
		complaints: ['bleeding', 'abdominal', 'other'],
	},
	{
		id: 'black_stool',
		label: 'Чорний стілець, схожий на дьоготь',
		complaints: ['bleeding', 'abdominal'],
	},
	{
		id: 'spreading_hives',
		label: 'Кропив’янка швидко поширюється по тілу',
		complaints: ['allergy', 'skin'],
	},
	{
		id: 'stiff_neck_fever',
		label: 'Сильний головний біль і напружена шия разом із температурою',
		complaints: ['high_fever'],
	},
	{
		id: 'persistent_vomit',
		label: 'Блювання не припиняється',
		complaints: ['abdominal', 'high_fever', 'injury'],
	},
	{
		id: 'rigid_abdomen',
		label: 'Живіт дуже болить від дотику',
		complaints: ['abdominal'],
	},
	{
		id: 'limb_unusable',
		label: 'Кінцівка не рухається або рана глибока',
		complaints: ['injury'],
	},
	{
		id: 'head_injury_vomit',
		label: 'Після удару голови є блювання або сильний головний біль',
		complaints: ['injury', 'consciousness'],
	},
	{
		id: 'spreading_redness',
		label: 'Почервоніння швидко розходиться, шкіра гаряча і болить',
		complaints: ['skin'],
	},
	{
		id: 'dangerous_behavior',
		label: 'Поведінка небезпечна для мене або людей поруч',
		complaints: ['mental', 'other'],
	},
]

export const redFlagsForComplaint = (complaint: string) =>
	redFlagOptions.filter(flag => flag.complaints.includes(complaint))
