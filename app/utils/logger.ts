// use as a debugging tool and/or logging tool

type LogLevel = 'log' | 'debug' | 'info' | 'warn' | 'error'

const levelPriority: Record<LogLevel, number> = {
	log: 0,
	debug: 1,
	info: 2,
	warn: 3,
	error: 4,
}

type BaseLogger = (
	level: LogLevel,
	event: string,
	data?: Record<string, any>,
) => void

type createLoggerOptions = {
	enabled?: boolean
	minLevel?: LogLevel
	skipTimestamp?: boolean
}

export const createLogger = (
	namespace: string,
	options: createLoggerOptions = {},
) => {
	const { enabled = true, minLevel = 'log', skipTimestamp = false } = options

	const base: BaseLogger = (level, event, data = {}) => {
		if (!enabled || levelPriority[level] < levelPriority[minLevel]) return

		const ts = skipTimestamp ? '' : `ts: ${new Date().toISOString()}`
		console[level](`[${namespace}] ${ts}`, event, data)
	}

	return {
		log: (event: string, data?: Record<string, any>) =>
			base('log', event, data),
		debug: (event: string, data?: Record<string, any>) =>
			base('debug', event, data),
		info: (event: string, data?: Record<string, any>) =>
			base('info', event, data),
		warn: (event: string, data?: Record<string, any>) =>
			base('warn', event, data),
		error: (event: string, data?: Record<string, any>) =>
			base('error', event, data),
	}
}
