import { orderStatus } from '../data/orderStatus'

export default function StatusTag({ status }) {
  const info = orderStatus[status] ?? { label: status, tone: 'neutral' }
  return <span className={`tag tag-status-${info.tone}`}>{info.label}</span>
}
