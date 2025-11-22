import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fsExtra from 'fs-extra'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const here = (...s: Array<string>) => path.join(__dirname, ...s)

export interface RepoCatalogItem {
	dir: string // Repository directory name
	repoUrl: string // Full Git URL
	commitSha?: string // Git commit SHA when cloned
	version?: string // Version/tag if applicable
	dateAdded: string // UTC ISO string when added to catalog
	languages: string[] // Programming languages used (e.g., ['TypeScript', 'JavaScript'])
	libraryType?:
		| 'component-library'
		| 'framework'
		| 'utility'
		| 'full-project'
		| 'example'
		| 'boilerplate'
		| 'other'
	isFullProject: boolean // Whether it's a complete application vs library/component
	license?: string // License type (e.g., 'MIT', 'Apache-2.0')
	creator?: string // Author/creator name or GitHub username
	description?: string // Brief description of what the repo demonstrates
	tags?: string[] // Additional tags for categorization (e.g., ['react', 'tailwind', 'ui-components'])
}

const CATALOG_FILE_PATH = path.join(process.cwd(), '.repos', 'catalog.csv')
const CSV_HEADERS = [
	'dateAdded',
	'dir',
	'repoUrl',
	'commitSha',
	'version',
	'languages',
	'libraryType',
	'isFullProject',
	'license',
	'creator',
	'description',
	'tags',
] as const

function escapeCsvField(
	value: string | string[] | boolean | undefined,
): string {
	if (value === undefined || value === null) return ''
	if (typeof value === 'boolean') return value ? 'true' : 'false'
	if (Array.isArray(value)) return value.join(';') // Use semicolon as array separator
	const str = String(value)
	// Escape quotes and wrap in quotes if contains comma, newline, or quote
	if (
		str.includes(',') ||
		str.includes('\n') ||
		str.includes('"') ||
		str.includes(';')
	) {
		return `"${str.replace(/"/g, '""')}"`
	}
	return str
}

function formatCsvRow(item: RepoCatalogItem): string {
	return CSV_HEADERS.map((header) => {
		const value = item[header]
		return escapeCsvField(value)
	}).join(',')
}

/**
 * Adds or updates a repository entry in the catalog
 * If the directory already exists, it updates the entry; otherwise creates a new one
 */
export function catalogRepo(item: Omit<RepoCatalogItem, 'dateAdded'>): void {
	const catalogItem: RepoCatalogItem = {
		...item,
		dateAdded: new Date().toISOString(),
	}

	// Ensure .repos directory exists
	const reposDir = path.dirname(CATALOG_FILE_PATH)
	fsExtra.ensureDirSync(reposDir)

	// Read existing catalog
	const existingEntries = readRepoCatalog()
	const existingIndex = existingEntries.findIndex(
		(e) => e.dir === catalogItem.dir,
	)

	if (existingIndex >= 0) {
		// Update existing entry (preserve original dateAdded)
		catalogItem.dateAdded = existingEntries[existingIndex].dateAdded
		existingEntries[existingIndex] = catalogItem
	} else {
		// Add new entry
		existingEntries.push(catalogItem)
	}

	// Write updated catalog
	const headerRow = CSV_HEADERS.join(',')
	const rows = existingEntries.map((entry) => formatCsvRow(entry))
	const content = [headerRow, ...rows].join('\n')
	fsExtra.writeFileSync(CATALOG_FILE_PATH, `${content}\n`)
}

/**
 * Reads all catalog entries
 */
export function readRepoCatalog(): RepoCatalogItem[] {
	if (!fsExtra.existsSync(CATALOG_FILE_PATH)) {
		return []
	}

	const content = fsExtra.readFileSync(CATALOG_FILE_PATH, 'utf-8')
	const lines = content.trim().split('\n')
	if (lines.length <= 1) return [] // Only headers or empty

	const entries: RepoCatalogItem[] = []
	for (let i = 1; i < lines.length; i++) {
		const line = lines[i]
		if (!line || !line.trim()) continue

		const values = parseCsvLine(line)
		if (values.length >= 3) {
			entries.push({
				dateAdded: values[0] || '',
				dir: values[1] || '',
				repoUrl: values[2] || '',
				commitSha: values[3] || undefined,
				version: values[4] || undefined,
				languages: values[5] ? values[5].split(';').filter(Boolean) : [],
				libraryType: values[6] as RepoCatalogItem['libraryType'] | undefined,
				isFullProject: values[7] === 'true',
				license: values[8] || undefined,
				creator: values[9] || undefined,
				description: values[10] || undefined,
				tags: values[11] ? values[11].split(';').filter(Boolean) : [],
			})
		}
	}

	return entries
}

/**
 * Finds catalog entries matching criteria
 */
export function findReposByCriteria(criteria: {
	languages?: string[]
	libraryType?: RepoCatalogItem['libraryType']
	isFullProject?: boolean
	tags?: string[]
}): RepoCatalogItem[] {
	const allEntries = readRepoCatalog()
	return allEntries.filter((entry) => {
		if (
			criteria.languages &&
			!criteria.languages.some((lang) => entry.languages.includes(lang))
		) {
			return false
		}
		if (criteria.libraryType && entry.libraryType !== criteria.libraryType) {
			return false
		}
		if (
			criteria.isFullProject !== undefined &&
			entry.isFullProject !== criteria.isFullProject
		) {
			return false
		}
		if (
			criteria.tags &&
			!criteria.tags.some((tag) => entry.tags?.includes(tag))
		) {
			return false
		}
		return true
	})
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
