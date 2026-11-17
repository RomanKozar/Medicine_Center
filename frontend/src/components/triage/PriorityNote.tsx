import { Badge } from '@/components/ui/badge'
import { getPriorityColor } from '@/lib/constant'
import { PriorityResult } from '@/lib/triage'

interface PriorityNoteProps {
	priority?: Partial<PriorityResult> | null
	compact?: boolean
	systemLabel?: string
	overrideReason?: string
}

const PriorityNote = ({
	priority,
	compact = false,
	systemLabel,
	overrideReason,
}: PriorityNoteProps) => {
	if (!priority?.level) return null

	return (
		<div className={compact ? 'space-y-1' : 'space-y-2'}>
			<div className='flex flex-wrap items-center gap-2'>
				<Badge className={getPriorityColor(priority.level)}>
					{priority.levelLabel || priority.level}
					{typeof priority.score === 'number' ? ` · ${priority.score}` : ''}
				</Badge>
				{overrideReason && (
					<span className='text-xs text-amber-700'>Змінено лікарем</span>
				)}
			</div>
			{overrideReason && (
				<p className='text-xs text-gray-700 text-left'>
					{systemLabel
						? `Рішення системи було «${systemLabel}». `
						: ''}
					Причина лікаря: {overrideReason}
				</p>
			)}
			{!compact && priority.reasons && priority.reasons.length > 0 && (
				<ul className='text-xs text-gray-600 space-y-1 text-left'>
					{priority.reasons.map(reason => (
						<li key={reason}>• {reason}</li>
					))}
				</ul>
			)}
			{!compact && priority.disclaimer && (
				<p className='text-xs text-gray-500'>{priority.disclaimer}</p>
			)}
		</div>
	)
}

export default PriorityNote
