import { orderStatus, progressSteps } from '../data/orderStatus'
import './OrderProgress.css'

export default function OrderProgress({ status }) {
  const currentIndex = progressSteps.indexOf(status)
  if (currentIndex === -1) return null

  return (
    <ol className="order-progress" aria-label="Andamento do pedido">
      {progressSteps.map((step, index) => {
        const state = index < currentIndex ? 'done' : index === currentIndex ? 'current' : 'pending'
        return (
          <li key={step} className={`progress-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="progress-dot">{index < currentIndex ? '✓' : index + 1}</span>
            <span className="progress-label">{orderStatus[step].label}</span>
          </li>
        )
      })}
    </ol>
  )
}
