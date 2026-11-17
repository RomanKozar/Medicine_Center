const EmergencyBanner = ({
	audience,
}: {
	audience: 'patient' | 'doctor'
}) => {
	return (
		<div className='rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800 text-left'>
			{audience === 'patient'
				? 'Це звернення має рівень «Невідкладно». Черга не замінює екстрену допомогу. Якщо є загроза життю, телефонуйте 103.'
				: 'Невідкладне звернення стоїть вище в черзі. Це не виклик екстреної допомоги.'}
		</div>
	)
}

export default EmergencyBanner
