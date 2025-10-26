import { PrismaInstrumentation } from '@prisma/instrumentation'
import { nodeProfilingIntegration } from '@sentry/profiling-node'
import * as Sentry from '@sentry/react-router'

export function init() {
	console.log('DEBUG PAT: Server monitoring initialization starting...')
	console.log('DEBUG PAT: NODE_ENV =', process.env.NODE_ENV)
	console.log(
		'DEBUG PAT: SENTRY_DSN =',
		process.env.SENTRY_DSN ? 'SET' : 'NOT SET',
	)

	// Skip Sentry initialization in test environment
	if (process.env.NODE_ENV === 'test') {
		console.log(
			'DEBUG PAT: Skipping server Sentry initialization in test environment',
		)
		return
	}

	try {
		Sentry.init({
			dsn: process.env.SENTRY_DSN,
			environment: process.env.NODE_ENV,
			denyUrls: [
				/\/resources\/healthcheck/,
				// TODO: be smarter about the public assets...
				/\/build\//,
				/\/favicons\//,
				/\/img\//,
				/\/fonts\//,
				/\/favicon.ico/,
				/\/site\.webmanifest/,
			],
			integrations: [
				Sentry.prismaIntegration({
					prismaInstrumentation: new PrismaInstrumentation(),
				}),
				Sentry.httpIntegration(),
				nodeProfilingIntegration(),
			],
			tracesSampler(samplingContext) {
				// ignore healthcheck transactions by other services (consul, etc.)
				if (samplingContext.request?.url?.includes('/resources/healthcheck')) {
					return 0
				}
				return process.env.NODE_ENV === 'production' ? 1 : 0
			},
			beforeSendTransaction(event) {
				// ignore all healthcheck related transactions
				//  note that name of header here is case-sensitive
				if (event.request?.headers?.['x-healthcheck'] === 'true') {
					return null
				}

				return event
			},
		})
		console.log(
			'DEBUG PAT: Server Sentry initialization completed successfully',
		)
	} catch (error) {
		console.error('DEBUG PAT: Server Sentry initialization failed:', error)
		throw error
	}
}
