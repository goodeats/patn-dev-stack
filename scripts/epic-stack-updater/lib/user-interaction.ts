/**
 * Epic Stack Updater Library - User Interaction Module
 *
 * This module handles all user input, prompting, and interaction logic
 * for the Epic Stack updater. It provides a clean interface for
 * collecting user decisions and preferences.
 */

import { execSync } from 'child_process'

/**
 * Handles all user interaction and input for the Epic Stack updater
 */
export class UserInteraction {
	/**
	 * Prompts the user for input using readline interface.
	 * Used for interactive decision making during the commit review process.
	 *
	 * @param question - The question to ask the user
	 * @returns Promise resolving to the user's trimmed response
	 */
	async promptUser(question: string): Promise<string> {
		const readline = await import('readline')
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		})

		return new Promise((resolve) => {
			rl.question(question, (answer) => {
				rl.close()
				resolve(answer.trim())
			})
		})
	}

	/**
	 * Prompts the user to choose whether to show only Pull Requests
	 *
	 * @returns Promise resolving to true if user wants PRs only, false otherwise
	 */
	async promptForPRFilter(): Promise<boolean> {
		const response = await this.promptUser(
			'❓ Show only Pull Requests? (y/n): ',
		)
		return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes'
	}

	/**
	 * Prompts the user to choose whether to proceed with interactive review
	 *
	 * @returns Promise resolving to true if user wants to proceed, false otherwise
	 */
	async promptForInteractiveReview(): Promise<boolean> {
		const response = await this.promptUser(
			'\n❓ Proceed with interactive review? (y/n): ',
		)
		return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes'
	}

	/**
	 * Prompts the user for a commit review decision
	 *
	 * @returns Promise resolving to user's decision: true (apply), false (skip), 'skip' (skip remaining), 'quit', or 'open'
	 */
	async promptForCommitDecision(): Promise<boolean | string> {
		const answer = await this.promptUser(
			'\n❓ Apply this commit? (y/n/s=skip remaining/q=quit/o=open PR): ',
		)

		switch (answer.toLowerCase()) {
			case 'y':
			case 'yes':
				return true
			case 'n':
			case 'no':
				return false
			case 's':
			case 'skip':
				return 'skip'
			case 'q':
			case 'quit':
				return 'quit'
			case 'o':
			case 'open':
				return 'open'
			default:
				return 'invalid'
		}
	}

	/**
	 * Prompts the user to continue with dependency conflicts
	 *
	 * @returns Promise resolving to true if user wants to continue, false otherwise
	 */
	async promptForDependencyConflicts(): Promise<boolean> {
		const response = await this.promptUser('❓ Continue anyway? (y/n): ')
		return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes'
	}

	/**
	 * Prompts the user for cherry-pick conflict resolution
	 *
	 * @returns Promise resolving to user's choice: 'continue', 'skip', 'abort', or 'auto-resolve'
	 */
	async promptForConflictResolution(): Promise<string> {
		const answer = await this.promptUser(
			'❓ What would you like to do? (continue/skip/abort/auto-resolve): ',
		)
		return answer.toLowerCase()
	}

	/**
	 * Prompts the user for auto-resolving package-lock.json conflicts
	 *
	 * @returns Promise resolving to true if user wants to auto-resolve, false otherwise
	 */
	async promptForAutoResolvePackageLock(): Promise<boolean> {
		const response = await this.promptUser(
			'❓ Auto-resolve by regenerating package-lock.json? (y/n): ',
		)
		return response.toLowerCase() === 'y' || response.toLowerCase() === 'yes'
	}

	/**
	 * Opens a pull request URL in the default web browser.
	 *
	 * @param prNumber - The pull request number
	 * @returns Promise resolving to true if opened successfully, false otherwise
	 */
	async openPRInBrowser(prNumber: string): Promise<boolean> {
		const url = `https://github.com/epicweb-dev/epic-stack/pull/${prNumber}`
		try {
			execSync(`open "${url}"`, { stdio: 'ignore' })
			return true
		} catch {
			return false
		}
	}
}
