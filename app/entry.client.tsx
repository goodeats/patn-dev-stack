import { startTransition } from 'react'
import { hydrateRoot } from 'react-dom/client'
import { HydratedRouter } from 'react-router/dom'

console.log('DEBUG PAT: Client entry point starting...')
console.log('DEBUG PAT: ENV.MODE =', ENV.MODE)
console.log('DEBUG PAT: ENV.SENTRY_DSN =', ENV.SENTRY_DSN ? 'SET' : 'NOT SET')

if (ENV.MODE === 'production' && ENV.SENTRY_DSN) {
	console.log('DEBUG PAT: Loading client monitoring...')
	void import('./utils/monitoring.client.tsx').then(({ init }) => {
		console.log('DEBUG PAT: Client monitoring module loaded, initializing...')
		init()
	}).catch((error) => {
		console.error('DEBUG PAT: Failed to load client monitoring:', error)
	})
} else {
	console.log('DEBUG PAT: Skipping client monitoring - MODE:', ENV.MODE, 'SENTRY_DSN:', ENV.SENTRY_DSN ? 'SET' : 'NOT SET')
}

startTransition(() => {
	console.log('DEBUG PAT: Starting React hydration...')
	hydrateRoot(document, <HydratedRouter />)
})
