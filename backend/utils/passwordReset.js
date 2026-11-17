const crypto = require('crypto')

const RESET_TTL_MS = 60 * 60 * 1000

function createResetToken() {
	const token = crypto.randomBytes(32).toString('hex')
	return {
		token,
		hash: hashResetToken(token),
		expires: new Date(Date.now() + RESET_TTL_MS),
	}
}

function hashResetToken(token) {
	return crypto.createHash('sha256').update(String(token)).digest('hex')
}

function buildResetUrl(type, token) {
	const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
	return `${frontendUrl}/reset-password?type=${encodeURIComponent(type)}&token=${encodeURIComponent(token)}`
}

async function sendResetEmail({ to, resetUrl }) {
	if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
		return { sent: false }
	}

	let nodemailer
	try {
		nodemailer = require('nodemailer')
	} catch (error) {
		return { sent: false }
	}

	const transport = nodemailer.createTransport({
		host: process.env.SMTP_HOST,
		port: Number(process.env.SMTP_PORT || 587),
		secure: process.env.SMTP_SECURE === 'true',
		auth: {
			user: process.env.SMTP_USER,
			pass: process.env.SMTP_PASS,
		},
	})

	await transport.sendMail({
		from: process.env.SMTP_FROM || process.env.SMTP_USER,
		to,
		subject: 'Відновлення пароля HealOnline',
		text: `Щоб задати новий пароль, відкрийте посилання протягом години:\n${resetUrl}`,
	})

	return { sent: true }
}

module.exports = {
	createResetToken,
	hashResetToken,
	buildResetUrl,
	sendResetEmail,
}
