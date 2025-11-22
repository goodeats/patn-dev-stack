import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fsExtra from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...s: Array<string>) => path.join(__dirname, ...s)

export interface RepoDirLogItem {
	dir: string
	action: 'clone' | 'read' | 'copy' | 'reference' | 'search'
	description: string
	timestamp: string // UTC ISO string
	repoUrl?: string // Git URL for re-cloning if needed
	filePath?: string // Specific file referenced (if applicable)
	context?: string // What feature/task was being worked on
}

// Always write to .repos/usage-log.csv from project root
// Works whether this file is in .repos.example or .repos
const LOG_FILE_PATH = path.join(process.cwd(), '.repos', 'usage-log.csv')
const CSV_HEADERS = [
	'timestamp',
	'dir',
	'action',
	'description',
	'repoUrl',
	'filePath',
	'context',
] as const

function escapeCsvField(value: string | undefined): string {
	if (!value) return ''
	// Escape quotes and wrap in quotes if contains comma, newline, or quote
	if (value.includes(',') || value.includes('\n') || value.includes('"')) {
		return `"${value.replace(/"/g, '""')}"`
	}
	return value
}

function formatCsvRow(item: RepoDirLogItem): string {
	return CSV_HEADERS.map((header) => {
		const value = item[header]
		return escapeCsvField(value)
	}).join(',')
}

/**
 * Appends a log entry to the .repos/usage-log.csv file
 * Creates the file with headers if it doesn't exist
 */
export function logRepoUsage(item: Omit<RepoDirLogItem, 'timestamp'>): void {
	const logItem: RepoDirLogItem = {
		...item,
		timestamp: new Date().toISOString(),
	}

	// Ensure .repos directory exists
	const reposDir = path.dirname(LOG_FILE_PATH)
	fsExtra.ensureDirSync(reposDir)

	// Check if file exists, if not create with headers
	const fileExists = fsExtra.existsSync(LOG_FILE_PATH)
	if (!fileExists) {
		const headerRow = CSV_HEADERS.join(',')
		fsExtra.writeFileSync(LOG_FILE_PATH, `${headerRow}\n`)
	}

	// Append the log entry
	const csvRow = formatCsvRow(logItem)
	fsExtra.appendFileSync(LOG_FILE_PATH, `${csvRow}\n`)
}

/**
 * Reads all log entries from the usage log
 */
export function readRepoUsageLog(): RepoDirLogItem[] {
	if (!fsExtra.existsSync(LOG_FILE_PATH)) {
		return []
	}

	const content = fsExtra.readFileSync(LOG_FILE_PATH, 'utf-8')
	const lines = content.trim().split('\n')
	if (lines.length <= 1) return [] // Only headers or empty

	const entries: RepoDirLogItem[] = []
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]
		if (!line || !line.trim()) continue

		const values = parseCsvLine(line)
		if (values.length >= 4) {
			entries.push({
				timestamp: values[0] || '',
				dir: values[1] || '',
				action: values[2] as RepoDirLogItem['action'],
				description: values[3] || '',
				repoUrl: values[4] || undefined,
				filePath: values[5] || undefined,
				context: values[6] || undefined,
			})
		}
	}

	return entries
}

function parseCsvLine(line: string): string[] {
	const values: string[] = []
	let current = ''
	let inQuotes = false

	for (let i = 0; i < line.length; i++) {
		const char = line[i]
		const nextChar = line[i + 1]

		if (char === '"') {
			if (inQuotes && nextChar === '"') {
				current += '"'
				i++ // Skip next quote
			} else {
				inQuotes = !inQuotes
			}
		} else if (char === ',' && !inQuotes) {
			values.push(current)
			current = ''
		} else {
			current += char
		}
	}
	values.push(current) // Add last value

	return values
}

