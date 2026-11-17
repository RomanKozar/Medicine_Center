const test = require('node:test')
const assert = require('node:assert/strict')
require('dotenv').config()
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const Appointment = require('../modal/Appointment')
const Doctor = require('../modal/Doctor')
const Patient = require('../modal/Patient')
const { createResetToken, hashResetToken } = require('./passwordReset')

const slotStart = new Date('2031-06-15T10:00:00.000Z')
const slotEnd = new Date('2031-06-15T10:30:00.000Z')

test.before(async () => {
	await mongoose.connect(process.env.MONGO_URL)
	await Appointment.syncIndexes()
})

test.after(async () => {
	await mongoose.disconnect()
})

test('скасований запис звільняє слот, а активний дубль ні', async () => {
	const doctor = await Doctor.findOne()
	const patient = await Patient.findOne()
	assert.ok(doctor && patient)

	await Appointment.deleteMany({
		doctorId: doctor._id,
		slotStartIso: slotStart,
	})

	const base = {
		doctorId: doctor._id,
		patientId: patient._id,
		date: new Date('2031-06-15T00:00:00.000Z'),
		slotStartIso: slotStart,
		slotEndIso: slotEnd,
		consultationFees: 100,
		platformFees: 10,
		totalAmount: 110,
		symptoms: 'Тест скасування',
	}

	const first = await Appointment.create({ ...base, status: 'Scheduled' })
	await assert.rejects(
		() => Appointment.create({ ...base, status: 'Scheduled' }),
		error => error && error.code === 11000
	)

	first.status = 'Cancelled'
	await first.save()

	const second = await Appointment.create({ ...base, status: 'Scheduled' })
	assert.equal(second.status, 'Scheduled')

	const visible = await Appointment.find({
		doctorId: doctor._id,
		slotStartIso: slotStart,
		status: { $ne: 'Cancelled' },
	})
	assert.equal(visible.length, 1)
	assert.equal(String(visible[0]._id), String(second._id))

	await Appointment.deleteMany({
		doctorId: doctor._id,
		slotStartIso: slotStart,
	})
})

test('посилання змінює пароль і старий хеш можна повернути', async () => {
	const patient = await Patient.findOne({ email: 'anna.petrenko@healonline.test' })
	assert.ok(patient)
	const previousPassword = patient.password

	const reset = createResetToken()
	patient.resetPasswordToken = reset.hash
	patient.resetPasswordExpires = reset.expires
	await patient.save()

	const found = await Patient.findOne({
		resetPasswordToken: hashResetToken(reset.token),
		resetPasswordExpires: { $gt: new Date() },
	})
	assert.ok(found)

	found.password = await bcrypt.hash('NewPass123', 12)
	found.resetPasswordToken = undefined
	found.resetPasswordExpires = undefined
	await found.save()

	const updated = await Patient.findById(patient._id)
	assert.equal(await bcrypt.compare('NewPass123', updated.password), true)
	assert.equal(updated.resetPasswordToken, undefined)

	updated.password = previousPassword
	await updated.save()
})
