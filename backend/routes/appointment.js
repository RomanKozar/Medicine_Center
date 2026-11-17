const express = require('express')
const Appointment = require('../modal/Appointment')
const Doctor = require('../modal/Doctor')
const Patient = require('../modal/Patient')
const {
	prioritizeAppeal,
	recommendCare,
	triageFromContext,
	doctorPriority,
	sortQueue,
	rulesCatalog,
} = require('../utils/prioritize')
const { authenticate, requireRole } = require('../middleware/auth')
const { query, body } = require('express-validator')
const validate = require('../middleware/validate')

const router = express.Router()

router.get('/rules', (req, res) => {
	res.ok(rulesCatalog(), 'Priority rules')
})

router.post('/recommend', async (req, res) => {
	try {
		const text = String(req.body?.text || '').trim()
		const complaint = String(req.body?.complaint || '').trim()
		if (!text && !complaint) {
			return res.badRequest('Опишіть проблему або оберіть категорію скарги')
		}

		const redFlags = Array.isArray(req.body?.redFlags)
			? req.body.redFlags.filter(item => typeof item === 'string')
			: []
		const advice = recommendCare({ text, complaint, redFlags })
		const specializations = advice.specialties.map(item => item.specialization)
		const doctors = await Doctor.find({
			isVerified: true,
			specialization: { $in: specializations },
		})
			.select('name specialization fees hospitalInfo profileImage')
			.limit(12)
			.lean()

		const order = new Map(specializations.map((item, index) => [item, index]))
		doctors.sort(
			(a, b) =>
				(order.get(a.specialization) ?? 99) - (order.get(b.specialization) ?? 99)
		)

		res.ok({ ...advice, doctors: doctors.slice(0, 4) }, 'Рекомендацію сформовано')
	} catch (error) {
		console.error('Recommend care error', error)
		res.serverError('Failed to recommend care', [error.message])
	}
})

//Doctor's appointment
router.get(
	'/doctor',
	authenticate,
	requireRole('doctor'),
	[
		query('status').optional().isArray().withMessage('Status can be an array'),
		query('status.*')
			.optional()
			.isString()
			.withMessage('Each status must be an string'),
	],
	validate,

	async (req, res) => {
		try {
			const { status } = req.query
			const filter = { doctorId: req.auth.id }

			if (status) {
				const statusArray = Array.isArray(status) ? status : [status]
				filter.status = { $in: statusArray }
			}

			const appointment = await Appointment.find(filter)
				.populate('patientId', 'name email phone dob age profileImage')
				.populate(
					'doctorId',
					'name fees phone specialization profileImage hospitalInfo'
				)

			const statusArray = status
				? Array.isArray(status)
					? status
					: [status]
				: []
			const queueView =
				statusArray.length === 0 ||
				statusArray.some(item => item === 'Scheduled' || item === 'In Progress')
			const ordered = queueView
				? sortQueue(appointment)
				: appointment
						.map(item => (item.toObject ? item.toObject() : item))
						.sort(
							(a, b) =>
								new Date(b.slotStartIso) - new Date(a.slotStartIso)
						)

			res.ok(ordered, 'Appointment fetched successfully')
		} catch (error) {
			console.error('Doctor appointment fetch error', error)
			res.serverError('Failed to fetch appointment', [error.message])
		}
	}
)

//patient appointmnet
router.get(
	'/patient',
	authenticate,
	requireRole('patient'),
	[
		query('status').optional().isArray().withMessage('Status can be an array'),
		query('status.*')
			.optional()
			.isString()
			.withMessage('Each status must be an string'),
	],
	validate,

	async (req, res) => {
		try {
			// ВИПРАВЛЕННЯ: Додано логування
			console.log('Auth user:', req.auth)
			const { status } = req.query
			const filter = { patientId: req.auth.id }

			if (status) {
				const statusArray = Array.isArray(status) ? status : [status]
				filter.status = { $in: statusArray }
			}
			const appointment = await Appointment.find(filter)
				.populate(
					'doctorId',
					'name fees phone specialization hospitalInfo profileImage'
				)
				.populate('patientId', 'name email profileImage')
				.sort({ slotStartIso: 1, slotEndIso: 1 })

			res.ok(appointment, 'Appointment fetched successfully')
		} catch (error) {
			console.error('Patient appointment fetch error', error)
			res.serverError('Failed to fetch appointment', [error.message])
		}
	}
)

//Cancel an active appointment and free the slot
router.put('/cancel/:id', authenticate, async (req, res) => {
	try {
		const appointment = await Appointment.findById(req.params.id)
		if (!appointment) {
			return res.notFound('Appointment not found')
		}

		const isDoctor =
			req.auth.type === 'doctor' &&
			appointment.doctorId.toString() === req.auth.id
		const isPatient =
			req.auth.type === 'patient' &&
			appointment.patientId.toString() === req.auth.id

		if (!isDoctor && !isPatient) {
			return res.forbidden('Access denied')
		}

		if (appointment.status !== 'Scheduled') {
			return res.badRequest('Можна скасувати лише запланований запис')
		}

		appointment.status = 'Cancelled'
		await appointment.save()
		res.ok(appointment, 'Appointment cancelled')
	} catch (error) {
		console.error('Cancel appointment error', error)
		res.serverError('Failed to cancel appointment', [error.message])
	}
})

//Get booked slot for doctor on specific date
router.get('/booked-slots/:doctorId/:date', async (req, res) => {
	try {
		const { doctorId, date } = req.params
		const startDay = new Date(date)
		startDay.setHours(0, 0, 0, 0)
		const endOfDay = new Date(date)
		endOfDay.setHours(23, 59, 59, 999)

		const bookedAppointment = await Appointment.find({
			doctorId,
			slotStartIso: { $gte: startDay, $lte: endOfDay },
			status: { $ne: 'Cancelled' },
		}).select('slotStartIso')

		const bookedSlot = bookedAppointment.map(apt => apt.slotStartIso)

		res.ok(bookedSlot, 'Booked slot retrieved')
	} catch (error) {
		// ВИПРАВЛЕННЯ: синтаксична помилка (res, serverError)
		res.serverError('Failed to fetch booked slot', [error.message])
	}
})

router.post(
	'/preview-priority',
	authenticate,
	requireRole('patient'),
	async (req, res) => {
		try {
			const patient = await Patient.findById(req.auth.id).select(
				'age medicalHistory'
			)
			const result = prioritizeAppeal(
				triageFromContext(req.body?.triage || {}, patient)
			)
			res.ok(result, 'Priority calculated')
		} catch (error) {
			res.serverError('Failed to calculate priority', [error.message])
		}
	}
)

router.post('/book', authenticate, requireRole('patient'), [
	body('doctorId').isMongoId().withMessage('valid doctor ID is required'),
	body('slotStartIso').isISO8601().withMessage('valid start time is required'),
	body('slotEndIso').isISO8601().withMessage('valid end time is required'),
	body('consultationType')
		.isIn(['Video Consultation', 'Voice Call'])
		.withMessage('valid consultation type required'),
	body('symptoms')
		.isString()
		.trim()
		.withMessage('symptoms decsription is required (min 10 char)'),
	body('consultationFees')
		.isNumeric()
		.withMessage('consultationFees is required'),
	body('platformFees').isNumeric().withMessage('platformFees is required'),
	body('totalAmount').isNumeric().withMessage('totalAmount is required'),
	,
	validate,

	async (req, res) => {
		try {
			const {
				doctorId,
				slotStartIso,
				slotEndIso,
				date,
				consultationType,
				symptoms,
				triage,
				consultationFees,
				platformFees,
				totalAmount,
			} = req.body

			const patient = await Patient.findById(req.auth.id).select(
				'age medicalHistory'
			)
			const triageInput = triageFromContext(triage || {}, patient)
			const priority = prioritizeAppeal(triageInput)

			const confictingAppointment = await Appointment.findOne({
				doctorId,
				status: { $in: ['Scheduled', 'In Progress'] },
				$or: [
					{
						slotStartIso: { $lt: new Date(slotEndIso) },
						slotEndIso: { $gt: new Date(slotStartIso) },
					},
				],
			})

			if (confictingAppointment) {
				return res.forbidden('This time slot is alredy booked')
			} //Generate unique roomId

			const zegoRoomId = `room_${Date.now()}_${Math.random()
				.toString(36)
				.substr(2, 9)}`

			const appointment = new Appointment({
				doctorId,
				patientId: req.auth.id,
				date: new Date(date),
				slotStartIso: new Date(slotStartIso),
				slotEndIso: new Date(slotEndIso),
				consultationType,
				symptoms,
				triage: {
					complaint: triageInput.complaint || '',
					severity: Number(triageInput.severity) || undefined,
					durationHours: Number(triageInput.durationHours) || undefined,
					redFlags: triageInput.redFlags,
					hasChronicCondition: triageInput.hasChronicCondition,
				},
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
				zegoRoomId,
				status: 'Scheduled',
				consultationFees,
				platformFees,
				totalAmount,
				paymentStatus: 'Pending',
				payoutStatus: 'Pending',
			})

			await appointment.save()

			await appointment.populate(
				'doctorId',
				'name fees phone specialization hospitalInfo profileImage'
			)
			await appointment.populate('patientId', 'name email')

			res.created(appointment, 'Appointment booked successfully')
		} catch (error) {
			if (error && error.code === 11000) {
				return res.forbidden('This time slot is already booked')
			}
			console.error('Book appointment error', error)
			res.serverError('Failed to book appointment', [error.message])
		}
	},
])

//Join
router.get('/join/:id', authenticate, async (req, res) => {
	try {
		const appointment = await Appointment.findById(req.params.id)
			.populate('patientId', 'name ')
			.populate('doctorId', 'name')

		if (!appointment) {
			return res.notFound('Appointment not found')
		}

		appointment.status = 'In Progress'
		await appointment.save()

		res.ok(
			{ roomId: appointment.zegoRoomId, appointment },
			'Consultation joined successfully'
		)
	} catch (error) {
		console.error('Join consultation error', error) // ВИПРАВЛЕННЯ: синтаксична помилка (res, serverError)
		res.serverError('Failed to Join consultation', [error.message])
	}
})

// //End
router.put('/end/:id', authenticate, async (req, res) => {
	try {
		const { prescription, notes } = req.body
		const appointment = await Appointment.findByIdAndUpdate(
			req.params.id,
			{
				status: 'Completed',
				prescription,
				notes,
				updatedAt: new Date(),
			},
			{ new: true }
		).populate('patientId doctorId')

		if (!appointment) {
			return res.notFound('Appointment not found')
		}

		res.ok(appointment, 'Consultation completed successfully')
	} catch (error) {
		console.error('End consultation error', error) // ВИПРАВЛЕННЯ: синтаксична помилка (res, serverError)
		res.serverError('Failed to End consultation', [error.message])
	}
})

router.put(
	'/reschedule/:id',
	authenticate,
	requireRole('doctor'),
	[body('slotStartIso').isISO8601().withMessage('valid start time is required')],
	validate,
	async (req, res) => {
		try {
			const appointment = await Appointment.findById(req.params.id)
			if (!appointment) return res.notFound('Appointment not found')
			if (appointment.doctorId.toString() !== req.auth.id) {
				return res.forbidden('Access denied')
			}
			if (!['Scheduled', 'In Progress'].includes(appointment.status)) {
				return res.badRequest('Час можна змінити лише для активного запису')
			}

			const start = new Date(req.body.slotStartIso)
			if (Number.isNaN(start.getTime())) {
				return res.badRequest('Некоректний час')
			}
			const previousStart = new Date(appointment.slotStartIso)
			if (start.getTime() === previousStart.getTime()) {
				return res.badRequest('Оберіть інший час')
			}

			const duration =
				new Date(appointment.slotEndIso).getTime() - previousStart.getTime()
			const end = new Date(start.getTime() + (duration > 0 ? duration : 30 * 60 * 1000))
			const clash = await Appointment.findOne({
				_id: { $ne: appointment._id },
				doctorId: appointment.doctorId,
				status: { $in: ['Scheduled', 'In Progress'] },
				slotStartIso: { $lt: end },
				slotEndIso: { $gt: start },
			})
			if (clash) return res.forbidden('Цей час уже зайнятий')

			const day = new Date(start)
			day.setHours(0, 0, 0, 0)
			appointment.date = day
			appointment.slotStartIso = start
			appointment.slotEndIso = end
			appointment.slotHistory = appointment.slotHistory || []
			appointment.slotHistory.push({
				from: previousStart,
				to: start,
				at: new Date(),
			})

			try {
				await appointment.save()
			} catch (error) {
				if (error && error.code === 11000) {
					return res.forbidden('Цей час уже зайнятий')
				}
				throw error
			}

			const fresh = await Appointment.findById(appointment._id)
				.populate('patientId', 'name email phone dob age profileImage')
				.populate(
					'doctorId',
					'name fees phone specialization hospitalInfo profileImage'
				)
			res.ok(fresh, 'Час запису змінено')
		} catch (error) {
			console.error('Reschedule appointment error', error)
			res.serverError('Failed to reschedule appointment', [error.message])
		}
	}
)

router.put(
	'/priority/:id',
	authenticate,
	requireRole('doctor'),
	[
		body('level')
			.isIn(['emergency', 'urgent', 'planned', 'routine'])
			.withMessage('valid priority level is required'),
		body('reason')
			.isString()
			.trim()
			.isLength({ min: 10, max: 500 })
			.withMessage('reason must be 10-500 characters'),
	],
	validate,
	async (req, res) => {
		try {
			const appointment = await Appointment.findById(req.params.id).populate(
				'patientId doctorId'
			)

			if (!appointment) {
				return res.notFound('Appointment not found')
			}

			if (appointment.doctorId._id.toString() !== req.auth.id) {
				return res.forbidden('Access denied')
			}

			if (!['Scheduled', 'In Progress'].includes(appointment.status)) {
				return res.badRequest('Priority can only be changed for an active appointment')
			}

			const next = doctorPriority(req.body.level)
			if (!next) {
				return res.badRequest('Unknown priority level')
			}

			if (appointment.priorityLevel === next.level) {
				return res.badRequest('Choose a different priority')
			}

			if (!appointment.priorityOverridden) {
				appointment.systemPriorityScore = appointment.priorityScore
				appointment.systemPriorityLevel = appointment.priorityLevel
				appointment.systemPriorityLabel = appointment.priorityLabel
				appointment.systemPriorityReasons = appointment.priorityReasons
			}

			appointment.priorityHistory = appointment.priorityHistory || []
			appointment.priorityHistory.push({
				fromLevel: appointment.priorityLevel,
				fromLabel: appointment.priorityLabel,
				fromScore: appointment.priorityScore,
				toLevel: next.level,
				toLabel: next.levelLabel,
				toScore: next.score,
				reason: req.body.reason.trim(),
				actor: 'doctor',
				actorName: appointment.doctorId?.name || 'Лікар',
				at: new Date(),
			})

			appointment.priorityLevel = next.level
			appointment.priorityLabel = next.levelLabel
			appointment.priorityScore = next.score
			appointment.priorityOverridden = true
			appointment.priorityOverrideReason = req.body.reason.trim()
			appointment.priorityOverriddenAt = new Date()
			await appointment.save()

			res.ok(appointment, 'Priority updated by doctor')
		} catch (error) {
			console.error('Priority override error', error)
			res.serverError('Failed to update priority', [error.message])
		}
	}
)

// //update appointment status by doctor
router.put(
	'/status/:id',
	authenticate,
	requireRole('doctor'),
	async (req, res) => {
		try {
			const { status } = req.body
			const appointment = await Appointment.findById(req.params.id).populate(
				'patientId doctorId'
			)

			if (!appointment) {
				return res.notFound('Appointment not found')
			}

			if (appointment.doctorId._id.toString() !== req.auth.id) {
				return res.forbidden('Access denied')
			}

			appointment.status = status
			appointment.updatedAt = new Date()
			await appointment.save()

			res.ok(appointment, 'Appointment status updated successfully')
		} catch (error) {
			console.error('updated Appointment status error', error) // ВИПРАВЛЕННЯ: синтаксична помилка (res, serverError)
			res.serverError('Failed to updated Appointment status', [error.message])
		}
	}
)

//Get single appointment by id

router.get('/:id', authenticate, async (req, res) => {
	try {
		const appointment = await Appointment.findById(req.params.id)
			.populate('patientId', 'name email phone dob age profileImage')
			.populate(
				'doctorId',
				'name fees phone specialization hospitalInfo profileImage'
			)

		if (!appointment) {
			return res.notFound('Appointment not found')
		} //check if user has access to this appointment

		const userRole = req.auth.type
		if (
			userRole === 'doctor' &&
			appointment.doctorId._id.toString() !== req.auth.id
		) {
			return res.forbidden('Access denied')
		}

		if (
			userRole === 'patient' &&
			appointment.patientId._id.toString() !== req.auth.id
		) {
			return res.forbidden('Access denied')
		}

		res.ok({ appointment }, 'Appointment fetched successfully')
	} catch (error) {
		console.error('Get appointment error', error) // ВИПРАВЛЕННЯ: синтаксична помилка (res, serverError)
		res.serverError('Failed to Get appointment', [error.message])
	}
})

module.exports = router
