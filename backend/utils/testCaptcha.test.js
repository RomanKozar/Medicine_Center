const test = require('node:test')
const assert = require('node:assert/strict')
const { createTestCaptcha, verifyTestCaptcha } = require('./testCaptcha')

test('тестова капча приймає показаний код один раз', () => {
	const captcha = createTestCaptcha()
	assert.equal(verifyTestCaptcha(captcha.id, captcha.code.toLowerCase()), true)
	assert.equal(verifyTestCaptcha(captcha.id, captcha.code), false)
})

test('чужий код тестової капчі відхиляється', () => {
	const captcha = createTestCaptcha()
	assert.equal(verifyTestCaptcha(captcha.id, 'AAAAA'), false)
})
