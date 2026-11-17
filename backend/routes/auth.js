const express = require('express')
const { body } = require('express-validator')
const validate = require('../middleware/validate')
const Doctor = require('../modal/Doctor')
const Patient = require('../modal/Patient')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const passport = require('passport')
const { authenticate } = require('../middleware/auth')
const {
	createResetToken,
	hashResetToken,
	buildResetUrl,
	sendResetEmail,
} = require('../utils/passwordReset')
const { createTestCaptcha, verifyTestCaptcha } = require('../utils/testCaptcha')

const TEST_DEMO_PASSWORD = 'Password123'

const router = express.Router()

const signToken = (id, type) =>
	jwt.sign({ id, type }, process.env.JWT_SECRET, { expiresIn: '7d' })

router.post(
	'/doctor/register',
	[
		body('name').notEmpty(),
		body('email').isEmail(),
		body('password').isLength({ min: 6 }),
	],
	validate,
	async (req, res) => {
		try {
			const exists = await Doctor.findOne({ email: req.body.email })
			if (exists) return res.badRequest('Doctor alredy exists')
			const hashed = await bcrypt.hash(req.body.password, 12)
			//const doc = Doctor.create({ ...req.body, password: hashed })
			//const token = signToken(doc._id, 'doctor')
			const doc = await Doctor.create({ ...req.body, password: hashed }) // ✅ ДОДАНО 'await'
			const token = signToken(doc._id, 'doctor')
			res.created(
				{ token, user: { id: doc._id, type: 'doctor' } },
				'Doctor registered'
			)
		} catch (error) {
			res.serverError('Registration failed', [error.message])
		}
	}
)

router.post(
	'/doctor/login',
	[body('email').isEmail(), body('password').isLength({ min: 6 })],
	validate,
	async (req, res) => {
		try {
			const doc = await Doctor.findOne({ email: req.body.email })
			if (!doc || !doc.password) return res.unauthorized('Invalid credentials')
			const match = await bcrypt.compare(req.body.password, doc.password)
			if (!match) return res.unauthorized('Invalid credentials')
			const token = signToken(doc._id, 'doctor')

			res.created(
				{ token, user: { id: doc._id, type: 'doctor' } },
				'Login successful'
			)
		} catch (error) {
			res.serverError('Login failed', [error.message])
		}
	}
)

router.post(
	'/patient/register',
	[
		body('name').notEmpty(),
		body('email').isEmail(),
		body('password').isLength({ min: 6 }),
	],
	validate,
	async (req, res) => {
		try {
			const exists = await Patient.findOne({ email: req.body.email })
			if (exists) return res.badRequest('Patient alredy exists')
			const hashed = await bcrypt.hash(req.body.password, 12)
			const patient = await Patient.create({ ...req.body, password: hashed })
			const token = signToken(patient._id, 'patient')
			res.created(
				{ token, user: { id: patient._id, type: 'patient' } },
				'Patient registered'
			)
		} catch (error) {
			res.serverError('Registration failed', [error.message])
		}
	}
)

router.post(
	'/patient/login',
	[body('email').isEmail(), body('password').isLength({ min: 6 })],
	validate,
	async (req, res) => {
		try {
			const patient = await Patient.findOne({ email: req.body.email })
			if (!patient || !patient.password)
				return res.unauthorized('Invalid credentials')
			const match = await bcrypt.compare(req.body.password, patient.password)
			if (!match) return res.unauthorized('Invalid credentials')
			const token = signToken(patient._id, 'patient')
			res.created(
				{ token, user: { id: patient._id, type: 'patient' } },
				'Login successful'
			)
		} catch (error) {
			res.serverError('Login failed', [error.message])
		}
	}
)

//Google Outh Start form here

router.get('/google', (req, res, next) => {
	const userType = req.query.type || 'patient'

	passport.authenticate('google', {
		scope: ['profile', 'email'],
		state: userType,
		prompt: 'select_account',
	})(req, res, next)
})

router.get(
	'/google/callback',
	passport.authenticate('google', {
		session: false,
		failureRedirect: '/auth/failure',
	}),

	async (req, res) => {
		try {
			const { user, type } = req.user
			const token = signToken(user._id, type)

			//Redirect to frontend with token
			const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
			const redirectUrl = `${frontendUrl}/auth/success?token=${token}&type=${type}&user=${encodeURIComponent(
				JSON.stringify({
					id: user._id,
					name: user.name,
					email: user.email,
					profileImage: user.profileImage,
				})
			)}`

			res.redirect(redirectUrl)
		} catch (error) {
			res.redirect(
				`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent(
					e.message
				)}`
			)
		}
	}
)

//Auth failure
router.get('/failure', (req, res) =>
	res.badRequest('Google authentication Failed')
)

const accountModel = type => (type === 'doctor' ? Doctor : Patient)

router.post(
	'/forgot-password',
	[
		body('email').isEmail(),
		body('type').isIn(['doctor', 'patient']),
	],
	validate,
	async (req, res) => {
		try {
			const email = req.body.email.trim()
			const type = req.body.type
			const Model = accountModel(type)
			const account = await Model.findOne({
				email: new RegExp(
					`^${email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
					'i'
				),
			})
			const message =
				'Якщо обліковий запис існує, інструкцію для зміни пароля надіслано.'

			if (!account) {
				return res.ok({ sent: false }, message)
			}

			const reset = createResetToken()
			account.resetPasswordToken = reset.hash
			account.resetPasswordExpires = reset.expires
			await account.save()

			const resetUrl = buildResetUrl(type, reset.token)
			const delivery = await sendResetEmail({ to: account.email, resetUrl })

			if (!delivery.sent) {
				console.log(`Password reset link for ${account.email}: ${resetUrl}`)
			}

			res.ok(
				{
					sent: delivery.sent,
					demoLink: delivery.sent ? undefined : resetUrl,
				},
				delivery.sent
					? message
					: 'Пошту не налаштовано. Для локальної демонстрації відкрийте посилання нижче.'
			)
		} catch (error) {
			res.serverError('Password reset failed', [error.message])
		}
	}
)

router.post(
	'/reset-password',
	[
		body('token').isString().isLength({ min: 20 }),
		body('type').isIn(['doctor', 'patient']),
		body('password').isLength({ min: 6 }),
	],
	validate,
	async (req, res) => {
		try {
			const Model = accountModel(req.body.type)
			const account = await Model.findOne({
				resetPasswordToken: hashResetToken(req.body.token),
				resetPasswordExpires: { $gt: new Date() },
			})

			if (!account) {
				return res.badRequest('Посилання недійсне або строк його дії закінчився')
			}

			account.password = await bcrypt.hash(req.body.password, 12)
			account.resetPasswordToken = undefined
			account.resetPasswordExpires = undefined
			await account.save()

			res.ok({ type: req.body.type }, 'Пароль змінено')
		} catch (error) {
			res.serverError('Password reset failed', [error.message])
		}
	}
)

router.get('/test-captcha', authenticate, (req, res) => {
	res.ok(createTestCaptcha(), 'Тестову перевірку створено')
})

router.post(
	'/test-password-preview',
	authenticate,
	[
		body('captchaId').isString().notEmpty(),
		body('captchaAnswer').isString().notEmpty(),
	],
	validate,
	async (req, res) => {
		try {
			if (!verifyTestCaptcha(req.body.captchaId, req.body.captchaAnswer)) {
				return res.badRequest('Код перевірки не збігається. Оновіть його і спробуйте ще раз.')
			}
			if (!req.user.password) {
				return res.badRequest(
					'Цей обліковий запис входить через Google. Окремого пароля немає.'
				)
			}

			const stillDemo = await bcrypt.compare(TEST_DEMO_PASSWORD, req.user.password)
			if (!stillDemo) {
				return res.ok(
					{ visible: false },
					'Пароль уже змінювали. Показати його не можна: у базі лишився лише хеш.'
				)
			}

			res.ok(
				{ visible: true, password: TEST_DEMO_PASSWORD },
				'Це тестовий пароль демонстраційного акаунта.'
			)
		} catch (error) {
			res.serverError('Password preview failed', [error.message])
		}
	}
)

router.post(
	'/change-password',
	authenticate,
	[
		body('currentPassword').isString().notEmpty(),
		body('newPassword').isLength({ min: 6 }),
		body('captchaId').isString().notEmpty(),
		body('captchaAnswer').isString().notEmpty(),
	],
	validate,
	async (req, res) => {
		try {
			if (!verifyTestCaptcha(req.body.captchaId, req.body.captchaAnswer)) {
				return res.badRequest('Код перевірки не збігається. Оновіть його і спробуйте ще раз.')
			}
			if (!req.user.password) {
				return res.badRequest(
					'Цей обліковий запис входить через Google. Пароль можна задати через відновлення.'
				)
			}

			const matches = await bcrypt.compare(
				req.body.currentPassword,
				req.user.password
			)
			if (!matches) return res.badRequest('Поточний пароль не збігається')
			if (req.body.currentPassword === req.body.newPassword) {
				return res.badRequest('Новий пароль має відрізнятися від поточного')
			}

			req.user.password = await bcrypt.hash(req.body.newPassword, 12)
			req.user.resetPasswordToken = undefined
			req.user.resetPasswordExpires = undefined
			await req.user.save()

			res.ok({ changed: true }, 'Пароль змінено')
		} catch (error) {
			res.serverError('Password change failed', [error.message])
		}
	}
)

module.exports = router
