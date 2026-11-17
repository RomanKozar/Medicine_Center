const crypto = require('crypto')

const CAPTCHA_TTL_MS = 5 * 60 * 1000
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const challenges = new Map()

function createTestCaptcha() {
	let code = ''
	for (let index = 0; index < 5; index += 1) {
		code += ALPHABET[crypto.randomInt(ALPHABET.length)]
	}
	const id = crypto.randomBytes(16).toString('hex')
	challenges.set(id, { code, expires: Date.now() + CAPTCHA_TTL_MS })
	return { id, code }
}

function verifyTestCaptcha(id, answer) {
	const item = challenges.get(id)
	challenges.delete(id)
	if (!item || item.expires < Date.now()) return false
	return String(answer || '').trim().toUpperCase() === item.code
}

module.exports = { createTestCaptcha, verifyTestCaptcha }
