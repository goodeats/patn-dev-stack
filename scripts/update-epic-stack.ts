#!/usr/bin/env tsx

import { execSync } from 'child_process'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

/**
 * Configuration object for tracking Epic Stack updates in package.json
 */
interface EpicStackConfig {
	/** The commit hash of the last processed Epic Stack commit */
	head: string
	/** The date of the last update in ISO format */
	date: string
}

/**
 * Information about a commit from the Epic Stack repository
 */
interface CommitInfo {
	/** Short commit hash (8 characters) */
	hash: string
	/** Commit message without PR reference */
	message: string
	/** Author name */
	author: string
	/** Commit date in YYYY-MM-DD format */
	date: string
	/** Pull request number if referenced in commit message */
	pr?: string
}

/**
 * Epic Stack Updater - A tool for systematically reviewing and applying
 * commits from the Epic Stack repository to your project.
 *
 * This class provides an interactive way to:
 * - Fetch latest changes from the Epic Stack repository
 * - Review each commit individually with full details
 * - Apply commits selectively based on your preferences
 * - Track progress to resume from where you left off
 *
 * @example
 * ```typescript
 * const updater = new EpicStackUpdater()
 * await updater.run()
 * ```
 */
class EpicStackUpdater {
	/** Path to the package.json file for tracking configuration */
	private packageJsonPath = './package.json'
	/** Name of the git remote for the upstream Epic Stack repository */
	private upstreamRemote = 'upstream'
	/** URL of the Epic Stack repository */
	private upstreamUrl = 'https://github.com/epicweb-dev/epic-stack.git'

	/**
	 * Creates a new EpicStackUpdater instance and ensures the upstream remote is configured
	 */
	constructor() {
		this.ensureUpstreamRemote()
	}

	/**
	 * Ensures the upstream remote is configured for the Epic Stack repository.
	 * If the remote doesn't exist, it will be added automatically.
	 *
	 * @throws {Error} Exits the process if remote setup fails
	 */
	private ensureUpstreamRemote() {
		try {
			const remotes = execSync('git remote -v', { encoding: 'utf8' })
			if (!remotes.includes('upstream')) {
				console.log('🔗 Adding upstream remote...')
				execSync(`git remote add ${this.upstreamRemote} ${this.upstreamUrl}`)
			}
		} catch (error) {
			console.error('❌ Failed to setup upstream remote:', error)
			process.exit(1)
		}
	}

	/**
	 * Fetches the latest changes from the upstream Epic Stack repository.
	 * This ensures we have the most recent commits available for review.
	 *
	 * @throws {Error} Exits the process if fetch fails
	 */
	private fetchLatest(): void {
		console.log('📥 Fetching latest changes from upstream...')
		try {
			execSync(`git fetch ${this.upstreamRemote}`)
		} catch (error) {
			console.error('❌ Failed to fetch from upstream:', error)
			process.exit(1)
		}
	}

	/**
	 * Retrieves the Epic Stack configuration from package.json.
	 * This contains the last processed commit hash and date for tracking progress.
	 *
	 * @returns {EpicStackConfig} The configuration object with head and date, or empty strings if not found
	 */
	private getEpicStackConfig(): EpicStackConfig {
		const packageJson = JSON.parse(
			readFileSync(this.packageJsonPath, 'utf8'),
		) as Record<string, any>
		return packageJson['epic-stack'] || { head: '', date: '' }
	}

	/**
	 * Updates the Epic Stack configuration in package.json with the latest processed commit.
	 * This allows the tool to resume from where it left off on subsequent runs.
	 *
	 * @param {string} newHead - The commit hash of the latest processed commit
	 * @param {string} newDate - The date of the latest processed commit
	 */
	private updateEpicStackConfig(newHead: string, newDate: string): void {
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
	 * Retrieves commits from the upstream repository since the last processed commit.
	 * If no previous commit is found, it returns the last 20 commits for initial setup.
	 *
	 * @param {string} lastCommit - The hash of the last processed commit, or empty string if none
	 * @returns {CommitInfo[]} Array of commit information objects
	 */
	private getCommitsSince(lastCommit: string): CommitInfo[] {
		if (!lastCommit) {
			console.log('⚠️  No previous commit found. Showing last 20 commits.')
			const output = execSync(
				`git log ${this.upstreamRemote}/main --oneline -20 --format="%H|%s|%an|%ad" --date=short`,
				{ encoding: 'utf8' },
			)
			return this.parseCommits(output)
		}

		const output = execSync(
			`git log ${this.upstreamRemote}/main --oneline --since="${lastCommit}" --format="%H|%s|%an|%ad" --date=short`,
			{ encoding: 'utf8' },
		)
		return this.parseCommits(output)
	}

	/**
	 * Parses git log output into structured CommitInfo objects.
	 * Extracts commit hash, message, author, date, and optional PR number.
	 *
	 * @param {string} output - Raw git log output with pipe-separated values
	 * @returns {CommitInfo[]} Array of parsed commit information objects
	 */
	private parseCommits(output: string): CommitInfo[] {
		return output
			.trim()
			.split('\n')
			.map((line) => {
				const parts = line.split('|')
				if (parts.length < 4 || !parts[0]) return null

				const hash = parts[0]
				const message = parts.slice(1, -2).join('|')
				const author = parts[parts.length - 2] || 'Unknown'
				const date = parts[parts.length - 1] || 'Unknown'

				// Extract PR number if present
				const prMatch = message.match(/\(#(\d+)\)/)
				const pr = prMatch ? prMatch[1] : undefined

				return {
					hash: hash.substring(0, 8), // Short hash
					message: message.replace(/\(#\d+\)/, '').trim(),
					author,
					date,
					pr,
				} as CommitInfo
			})
			.filter((commit): commit is CommitInfo => commit !== null)
	}

	/**
	 * Retrieves detailed information about a specific commit including changed files and diff statistics.
	 *
	 * @param {string} hash - The commit hash to get details for
	 * @returns {{files: string[], diff: string}} Object containing changed files array and diff statistics
	 */
	private getCommitDetails(hash: string): { files: string[]; diff: string } {
		// Get full commit hash for git operations
		const fullHash = this.getFullCommitHash(hash)

		const files = execSync(
			`git diff-tree --no-commit-id --name-only -r ${fullHash}`,
			{ encoding: 'utf8' },
		)
			.trim()
			.split('\n')
			.filter(Boolean)

		const diff = execSync(`git show ${fullHash} --stat`, { encoding: 'utf8' })

		return { files, diff }
	}

	/**
	 * Gets the full commit hash from a short hash.
	 * This is needed for git operations that require the full hash.
	 *
	 * @param {string} shortHash - The short commit hash (8 characters)
	 * @returns {string} The full commit hash
	 */
	private getFullCommitHash(shortHash: string): string {
		try {
			const output = execSync(`git rev-parse ${shortHash}`, {
				encoding: 'utf8',
			})
			return output.trim()
		} catch (error) {
			console.error(`❌ Failed to get full hash for ${shortHash}:`, error)
			return shortHash
		}
	}

	/**
	 * Displays commits in a formatted table before starting the review process.
	 * Shows commit hash, message, author, date, PR number, file count, and PR link.
	 *
	 * @param {CommitInfo[]} commits - Array of commits to display
	 */
	private displayCommitsTable(commits: CommitInfo[]): void {
		console.log('\n📋 Commits to Review:')
		console.log('='.repeat(180))

		// Table header
		console.log(
			`${'Hash'.padEnd(10)} ${'PR'.padEnd(6)} ${'Author'.padEnd(20)} ${'Date'.padEnd(12)} ${'Files'.padEnd(6)} ${'Message'.padEnd(40)} ${'PR Link'}`,
		)
		console.log('-'.repeat(180))

		// Display each commit
		for (let i = 0; i < commits.length; i++) {
			const commit = commits[i]
			if (!commit) continue

			const details = this.getCommitDetails(commit.hash)
			const fileCount = details.files.length

			const hash = commit.hash.padEnd(10)
			const pr = (commit.pr || 'N/A').padEnd(6)
			const author = commit.author.substring(0, 20).padEnd(20)
			const date = commit.date.padEnd(12)
			const files = fileCount.toString().padEnd(6)
			const message = commit.message.substring(0, 40).padEnd(40)
			const prLink = commit.pr
				? `https://github.com/epicweb-dev/epic-stack/pull/${commit.pr}`
				: 'N/A'

			console.log(
				`${hash} ${pr} ${author} ${date} ${files} ${message} ${prLink}`,
			)
		}

		console.log('-'.repeat(180))
		console.log(`Total: ${commits.length} commits`)
	}

	/**
	 * Opens a pull request URL in the default web browser.
	 *
	 * @param {string} prNumber - The pull request number
	 */
	private openPRInBrowser(prNumber: string): void {
		const url = `https://github.com/epicweb-dev/epic-stack/pull/${prNumber}`
		try {
			execSync(`open "${url}"`, { stdio: 'ignore' })
			console.log(`🌐 Opened PR #${prNumber} in browser`)
		} catch (error) {
			console.log(`🔗 PR #${prNumber}: ${url}`)
			console.log('   (Copy the URL above to open in your browser)')
		}
	}

	/**
	 * Prompts the user for input using readline interface.
	 * Used for interactive decision making during the commit review process.
	 *
	 * @param {string} question - The question to ask the user
	 * @returns {Promise<string>} The user's trimmed response
	 */
	private async promptUser(question: string): Promise<string> {
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
	 * Presents commit information to the user and prompts for a decision.
	 * Shows commit details including hash, message, author, date, PR link, and file changes.
	 *
	 * @param {CommitInfo} commit - The commit information to review
	 * @returns {Promise<boolean|string>} User's decision: true (apply), false (skip), 'skip' (skip remaining), or 'quit'
	 */
	private async reviewCommit(commit: CommitInfo): Promise<boolean | string> {
		console.log('\n' + '='.repeat(80))
		console.log(`📋 Commit: ${commit.hash}`)
		console.log(`📝 Message: ${commit.message}`)
		console.log(`👤 Author: ${commit.author}`)
		console.log(`📅 Date: ${commit.date}`)
		if (commit.pr) {
			console.log(
				`🔗 PR: https://github.com/epicweb-dev/epic-stack/pull/${commit.pr}`,
			)
		}

		const details = this.getCommitDetails(commit.hash)
		console.log(`📁 Files changed: ${details.files.length}`)
		console.log('📊 Changes:')
		console.log(details.diff)

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
				if (commit.pr) {
					this.openPRInBrowser(commit.pr)
					return this.reviewCommit(commit) // Re-prompt after opening PR
				} else {
					console.log('❌ No PR associated with this commit')
					return this.reviewCommit(commit)
				}
			default:
				console.log('Invalid choice. Please enter y/n/s/q/o')
				return this.reviewCommit(commit)
		}
	}

	/**
	 * Applies a commit from the upstream repository to the current branch using cherry-pick.
	 * Creates a temporary branch for the operation to ensure clean application.
	 *
	 * @param {string} hash - The commit hash to apply
	 * @returns {Promise<boolean>} True if the commit was successfully applied, false otherwise
	 */
	private async applyCommit(hash: string): Promise<boolean> {
		try {
			console.log(`🔄 Applying commit ${hash}...`)

			// Get full commit hash for git operations
			const fullHash = this.getFullCommitHash(hash)

			// Create a temporary branch for this commit
			const tempBranch = `temp-${hash}`
			execSync(`git checkout -b ${tempBranch}`)

			// Cherry-pick the commit
			execSync(`git cherry-pick ${fullHash}`)

			// Merge back to current branch
			execSync(`git checkout -`)
			execSync(`git merge ${tempBranch}`)

			// Clean up temp branch
			execSync(`git branch -d ${tempBranch}`)

			console.log(`✅ Successfully applied commit ${hash}`)
			return true
		} catch (error) {
			console.error(`❌ Failed to apply commit ${hash}:`, error)

			// Clean up temp branch if it exists
			try {
				execSync(`git branch -D temp-${hash}`)
			} catch {}

			const answer = await this.promptUser(
				'❓ Resolve conflicts manually and continue? (y/n): ',
			)
			if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
				return true
			}
			return false
		}
	}

	/**
	 * Main execution method that orchestrates the entire Epic Stack update process.
	 *
	 * This method:
	 * 1. Fetches latest changes from upstream
	 * 2. Retrieves commits since last update
	 * 3. Presents each commit for user review
	 * 4. Applies approved commits
	 * 5. Updates tracking configuration
	 * 6. Provides summary of actions taken
	 *
	 * @returns {Promise<void>} Resolves when the update process is complete
	 */
	async run(): Promise<void> {
		console.log('🚀 Epic Stack Updater')
		console.log('==================')

		// Fetch latest changes
		this.fetchLatest()

		// Get current tracking info
		const config = this.getEpicStackConfig()
		console.log(`📍 Last tracked commit: ${config.head || 'none'}`)
		console.log(`📅 Last update: ${config.date || 'never'}`)

		// Get commits since last update
		const commits = this.getCommitsSince(config.head)

		if (commits.length === 0) {
			console.log('✅ No new commits to review!')
			return
		}

		console.log(`📊 Found ${commits.length} new commits to review`)

		// Display commits table for overview
		this.displayCommitsTable(commits)

		// Ask user if they want to proceed with interactive review
		const proceed = await this.promptUser(
			'\n❓ Proceed with interactive review? (y/n): ',
		)
		if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
			console.log('👋 Exiting without reviewing commits')
			return
		}

		let appliedCount = 0
		let skippedCount = 0

		for (const commit of commits) {
			const decision = await this.reviewCommit(commit)

			if (decision === 'quit') {
				console.log('👋 Stopping review process')
				break
			}

			if (decision === 'skip') {
				console.log('⏭️  Skipping remaining commits')
				break
			}

			if (decision === true) {
				const success = await this.applyCommit(commit.hash)
				if (success) {
					appliedCount++
					// Update tracking to this commit
					this.updateEpicStackConfig(commit.hash, commit.date)
				}
			} else {
				skippedCount++
			}
		}

		console.log('\n📊 Summary:')
		console.log(`✅ Applied: ${appliedCount}`)
		console.log(`⏭️  Skipped: ${skippedCount}`)
		console.log(`📋 Total reviewed: ${appliedCount + skippedCount}`)

		if (appliedCount > 0) {
			console.log("\n🧪 Don't forget to test your changes!")
			console.log('   npm run build')
			console.log('   npm run dev')
			console.log('   npm run test')
		}
	}
}

/**
 * Creates and runs the Epic Stack updater instance.
 * This is the main entry point for the script.
 *
 * @example
 * ```bash
 * npm run update:epic-stack
 * ```
 */
const updater = new EpicStackUpdater()
updater.run().catch(console.error)
