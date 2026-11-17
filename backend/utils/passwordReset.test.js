const test = require('node:test')
const assert = require('node:assert/strict')
const { createResetToken, hashResetToken } = require('./passwordReset')

test('токен відновлення збігається зі своїм хешем', () => {
	const reset = createResetToken()
	assert.equal(hashResetToken(reset.token), reset.hash)
	assert.notEqual(reset.token, reset.hash)
	assert.ok(reset.expires.getTime() > Date.now())
})
