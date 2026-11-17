import { Appointment } from '@/store/appointmentStore'

export const SLOT_NOTICE_EVENT = 'slot-notices-seen'
const SEEN_KEY = 'healonline-seen-slot-changes'

export type SlotNotice = {
	id: string
	at: string
	doctorName: string
	fromLabel: string
	toLabel: string
}

export const formatSlotMoment = (iso?: string) => {
	if (!iso) return ''
	const date = new Date(iso)
	if (Number.isNaN(date.getTime())) return ''
	return date.toLocaleString('uk-UA', {
		day: 'numeric',
		month: 'long',
		hour: '2-digit',
		minute: '2-digit',
	})
}

export const slotNotices = (appointments: Appointment[]): SlotNotice[] =>
	appointments
		.flatMap(appointment => {
			const last = appointment.slotHistory?.[appointment.slotHistory.length - 1]
			if (!last?.at || !last.to) return []
			return [
				{
					id: appointment._id,
					at: last.at,
					doctorName: appointment.doctorId?.name || 'Лікар',
					fromLabel: formatSlotMoment(last.from),
					toLabel: formatSlotMoment(last.to),
				},
			]
		})
		.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

export const readSeenSlotNotices = (): Record<string, string> => {
	if (typeof window === 'undefined') return {}
	try {
		return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')
	} catch {
		return {}
	}
}

export const markSlotNoticeSeen = (id: string, at: string) => {
	const seen = readSeenSlotNotices()
	seen[id] = at
	localStorage.setItem(SEEN_KEY, JSON.stringify(seen))
	window.dispatchEvent(new Event(SLOT_NOTICE_EVENT))
}

export const unseenSlotNotices = (
	appointments: Appointment[],
	seen: Record<string, string>
) => slotNotices(appointments).filter(notice => seen[notice.id] !== notice.at)
