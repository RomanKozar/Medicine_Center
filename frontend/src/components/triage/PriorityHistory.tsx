export interface PriorityHistoryItem {
	fromLevel?: string
	fromLabel?: string
	fromScore?: number
	toLevel?: string
	toLabel?: string
	toScore?: number
	reason?: string
	actor?: 'system' | 'doctor' | string
	actorName?: string
	at?: string
}

const PriorityHistory = ({ history }: { history?: PriorityHistoryItem[] }) => {
	if (!history || history.length === 0) return null

	return (
		<div className='mt-3 text-left'>
			<p className='text-sm font-semibold text-gray-800'>Протокол рішення</p>
			<ul className='mt-2 space-y-2'>
				{history.map((item, index) => (
					<li
						key={`${item.at || index}-${item.toLevel}`}
						className='text-xs text-gray-600 border-l-2 border-blue-200 pl-2'
					>
						<span className='font-medium text-gray-800'>
							{item.actor === 'doctor' ? item.actorName || 'Лікар' : 'Система'}
						</span>
						{item.at && <span> · {new Date(item.at).toLocaleString('uk-UA')}</span>}
						<p>
							{item.fromLabel
								? `Було «${item.fromLabel}» (${item.fromScore}). `
								: ''}
							Стало «{item.toLabel}» ({item.toScore}). {item.reason}
						</p>
					</li>
				))}
			</ul>
		</div>
	)
}

export default PriorityHistory
