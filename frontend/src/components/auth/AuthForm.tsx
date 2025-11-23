import React, { useEffect, useState } from 'react'

interface AuthFormProps {
	type: 'login' | 'signup'
	userRole: 'doctor' | 'patient'
}

const AuthForm = ({ type, userRole }: AuthFormProps) => {
	return <div>AuthForm</div>
}

export default AuthForm
