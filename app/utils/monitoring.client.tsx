import * as Sentry from '@sentry/react-router'

export function init() {
	console.log('DEBUG PAT: Client monitoring initialization starting...')
	console.log('DEBUG PAT: ENV.MODE =', ENV.MODE)
	console.log('DEBUG PAT: ENV.SENTRY_DSN =', ENV.SENTRY_DSN ? 'SET' : 'NOT SET')
	
	try {
		Sentry.init({
			dsn: ENV.SENTRY_DSN,
			environment: ENV.MODE,
			beforeSend(event) {
				if (event.request?.url) {
					const url = new URL(event.request.url)
					if (
						url.protocol === 'chrome-extension:' ||
						url.protocol === 'moz-extension:'
					) {
						// This error is from a browser extension, ignore it
						return null
					}
				}
				return event
			},
			integrations: [
				Sentry.replayIntegration(),
				(() => {
					try {
						console.log('DEBUG PAT: Adding browserProfilingIntegration...')
						const integration = Sentry.browserProfilingIntegration()
						console.log('DEBUG PAT: browserProfilingIntegration added successfully')
						return integration
					} catch (error) {
						console.error('DEBUG PAT: browserProfilingIntegration failed:', error)
						throw error
					}
				})(),
			],

			// Set tracesSampleRate to 1.0 to capture 100%
			// of transactions for performance monitoring.
			// We recommend adjusting this value in production
			tracesSampleRate: 1.0,

			// Capture Replay for 10% of all sessions,
			// plus for 100% of sessions with an error
			replaysSessionSampleRate: 0.1,
			replaysOnErrorSampleRate: 1.0,
		})
		console.log('DEBUG PAT: Client Sentry initialization completed successfully')
	} catch (error) {
		console.error('DEBUG PAT: Client Sentry initialization failed:', error)
		throw error
	}
}
