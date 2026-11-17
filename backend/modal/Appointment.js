const mongoose = require('mongoose')

const appointmentSchema = new mongoose.Schema(
	{
		doctorId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Doctor',
			required: true,
		},
		patientId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Patient',
			required: true,
		},
		date: { type: Date, required: true },
		slotStartIso: { type: Date, required: true },
		slotEndIso: { type: Date, required: true },

		consultationType: {
			type: String,
			enum: ['Video Consultation', 'Voice Call'],
			default: 'Video Consultation',
		},
		status: {
			type: String,
			enum: ['Scheduled', 'Completed', 'Cancelled', 'In Progress'],
			default: 'Scheduled',
		},
		symptoms: { type: String, default: '' },
		triage: {
			complaint: { type: String, default: '' },
			severity: { type: Number },
			durationHours: { type: Number },
			redFlags: { type: [String], default: [] },
			hasChronicCondition: { type: Boolean, default: false },
		},
		priorityScore: { type: Number, default: 0 },
		priorityLevel: {
			type: String,
			enum: ['emergency', 'urgent', 'planned', 'routine'],
			default: 'routine',
		},
		priorityLabel: { type: String, default: 'Може зачекати' },
		priorityReasons: { type: [String], default: [] },
		systemPriorityScore: { type: Number, default: 0 },
		systemPriorityLevel: {
			type: String,
			enum: ['emergency', 'urgent', 'planned', 'routine'],
			default: 'routine',
		},
		systemPriorityLabel: { type: String, default: 'Може зачекати' },
		systemPriorityReasons: { type: [String], default: [] },
		priorityOverridden: { type: Boolean, default: false },
		priorityOverrideReason: { type: String, default: '' },
		priorityOverriddenAt: { type: Date },
		slotHistory: {
			type: [
				{
					from: { type: Date },
					to: { type: Date },
					at: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
		priorityHistory: {
			type: [
				{
					fromLevel: { type: String, default: '' },
					fromLabel: { type: String, default: '' },
					fromScore: { type: Number, default: 0 },
					toLevel: { type: String, default: '' },
					toLabel: { type: String, default: '' },
					toScore: { type: Number, default: 0 },
					reason: { type: String, default: '' },
					actor: { type: String, enum: ['system', 'doctor'], default: 'system' },
					actorName: { type: String, default: '' },
					at: { type: Date, default: Date.now },
				},
			],
			default: [],
		},
		zegoRoomId: { type: String, default: '' },
		prescription: { type: String, default: '' },
		notes: { type: String, default: '' },

		//Payment fields
		consultationFees: { type: Number, required: true },
		platformFees: { type: Number, required: true },
		totalAmount: { type: Number, required: true },
		paymentStatus: {
			type: String,
			enum: ['Pending', 'Paid', 'refunded'],
			default: 'Pending',
		},

		payoutStatus: {
			type: String,
			enum: ['Pending', 'Paid', 'Cancelled'],
			default: 'Pending',
		},

		payoutDate: { type: Date },
		paymentMethod: { type: String, default: 'Online' },

		//razorPay payment field
		// razorpayOrderId: { type: String },
		// razorpayPaymentId: { type: String },
		// razorpaySignature: { type: String },
		// paymentDate: { type: Date },
	},
	{ timestamps: true }
)

//1 means accending order
//unique: true means uniquness is enfoced across that combination of filds
appointmentSchema.index(
	{ doctorId: 1, date: 1, slotStartIso: 1 },
	{
		unique: true,
		partialFilterExpression: {
			status: { $in: ['Scheduled', 'In Progress'] },
		},
	}
)

module.exports = mongoose.model('Appointment', appointmentSchema)
