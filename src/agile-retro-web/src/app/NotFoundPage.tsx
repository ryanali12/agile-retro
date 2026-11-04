import { Link } from 'react-router'
import { buttonStyles } from '../shared/components/ui'

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-start gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="text-muted">That page does not exist.</p>
      <Link to="/" className={buttonStyles({ variant: 'secondary', size: 'sm' })}>
        Go home
      </Link>
    </div>
  )
}
