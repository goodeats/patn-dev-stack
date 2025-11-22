/**
 * Epic Stack Updater Library - Configuration Manager
 *
 * This module handles reading and writing the Epic Stack configuration
 * stored in package.json, including automatic package-lock.json regeneration.
 */

import { execSync } from 'child_process'
import { readFileSync, writeFileSync } from 'fs'
import { type EpicStackConfig } from './types.js'

/**
 * Manages Epic Stack configuration stored in package.json
 */
export class ConfigManager {
	/**
	 * Creates a new ConfigManager instance
	 *
	 * @param packageJsonPath - Path to the package.json file
	 */
	constructor(private packageJsonPath: string = './package.json') {}

	/**
	 * Retrieves the Epic Stack configuration from package.json.
	 * This contains the last processed commit hash and date for tracking progress.
	 *
	 * @returns The configuration object with head and date, or empty strings if not found
	 */
	getEpicStackConfig(): EpicStackConfig {
		const packageJson = JSON.parse(
			readFileSync(this.packageJsonPath, 'utf8'),
		) as Record<string, any>
		return packageJson['epic-stack'] || { head: '', date: '' }
	}

	/**
	 * Updates the Epic Stack configuration in package.json with the latest processed commit.
	 * This allows the tool to resume from where it left off on subsequent runs.
	 *
	 * @param newHead - The commit hash of the latest processed commit
	 * @param newDate - The date of the latest processed commit
	 */
	updateEpicStackConfig(newHead: string, newDate: string): void {
		const packageJson = JSON.parse(
			readFileSync(this.packageJsonPath, 'utf8'),
		) as Record<string, any>
		packageJson['epic-stack'] = { head: newHead, date: newDate }
		writeFileSync(
			this.packageJsonPath,
			JSON.stringify(packageJson, null, 2) + '\n',
		)
	}

	/**
	 * Checks if the package.json file exists and is readable
	 *
	 * @returns True if the file exists and is readable
	 */
	isConfigFileAccessible(): boolean {
		try {
			readFileSync(this.packageJsonPath, 'utf8')
			return true
		} catch {
			return false
		}
	}

	/**
	 * Gets the current package.json content as a parsed object
	 *
	 * @returns The parsed package.json object
	 */
	getPackageJson(): Record<string, any> {
		return JSON.parse(readFileSync(this.packageJsonPath, 'utf8')) as Record<
			string,
			any
		>
	}

	/**
	 * Updates the package.json file with new content.
	 * Regenerates package-lock.json when dependencies are changed.
	 *
	 * @param packageJson - The updated package.json object
	 */
	updatePackageJson(packageJson: Record<string, any>): void {
		writeFileSync(
			this.packageJsonPath,
			JSON.stringify(packageJson, null, 2) + '\n',
		)

		// Regenerate package-lock.json when dependencies are updated
		try {
			console.log(
				'🔄 Regenerating package-lock.json after dependency update...',
			)
			execSync('npm install --package-lock-only')
			console.log('✅ Package-lock.json regenerated successfully')
		} catch {
			console.log(
				'⚠️  Could not regenerate package-lock.json - you may need to run npm install manually',
			)
		}
	}
}
