#!/usr/bin/env tsx

/**
 * Epic Stack Updater Library - Main CLI Entry Point
 *
 * This is the main CLI application that orchestrates the Epic Stack update process.
 * It provides an interactive interface for reviewing and applying commits from
 * the Epic Stack repository.
 */

import { ConfigManager } from './lib/config-manager.js'
import { CommitParser } from './lib/commit-parser.js'
import { GitOperations } from './lib/git-operations.js'
import type { CommitInfo, UpdateSummary, UpdaterOptions } from './lib/types.js'

/**
 * Epic Stack Updater - A tool for systematically reviewing and applying
 * commits from the Epic Stack repository to your project.
 *
 * This class provides an interactive way to:
 * - Fetch latest changes from the Epic Stack repository
 * - Review each commit individually with full details
 * - Apply commits selectively based on your preferences
 * - Track progress to resume from where you left off
 */
export class EpicStackUpdater {
	private configManager: ConfigManager
	private commitParser: CommitParser
	private gitOperations: GitOperations

	/**
	 * Creates a new EpicStackUpdater instance
	 *
	 * @param options - Configuration options for the updater
	 */
	constructor(options: UpdaterOptions = {}) {
		this.configManager = new ConfigManager(options.packageJsonPath)
		this.commitParser = new CommitParser(options.upstreamRemote)
		this.gitOperations = new GitOperations(
			options.upstreamRemote,
			options.upstreamUrl,
		)
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
	 * @returns Promise resolving when the update process is complete
	 */
	async run(): Promise<UpdateSummary> {
		console.log('🚀 Epic Stack Updater')
		console.log('==================')

		// Ensure upstream remote is configured
		this.gitOperations.ensureUpstreamRemote()

		// Fetch latest changes
		this.gitOperations.fetchLatest()

		// Get current tracking info
		const config = this.configManager.getEpicStackConfig()
		console.log(`📍 Last tracked commit: ${config.head || 'none'}`)
		console.log(`📅 Last update: ${config.date || 'never'}`)

		// Ask user if they want to filter to only Pull Requests
		const filterPRs = await this.promptUser(
			'❓ Show only Pull Requests? (y/n): ',
		)

		// Get commits since last update
		const commits = this.commitParser.getCommitsSince(
			config.head,
			filterPRs.toLowerCase() === 'y' || filterPRs.toLowerCase() === 'yes',
		)

		if (commits.length === 0) {
			console.log('✅ No new commits to review!')
			return {
				appliedCount: 0,
				skippedCount: 0,
				totalReviewed: 0,
				hasChanges: false,
			}
		}

		const filterText =
			filterPRs.toLowerCase() === 'y' || filterPRs.toLowerCase() === 'yes'
				? ' Pull Request commits'
				: ' commits'
		console.log(`📊 Found ${commits.length} new${filterText} to review`)

		// Display commits table for overview
		this.displayCommitsTable(
			commits,
			filterPRs.toLowerCase() === 'y' || filterPRs.toLowerCase() === 'yes',
		)

		// Ask user if they want to proceed with interactive review
		const proceed = await this.promptUser(
			'\n❓ Proceed with interactive review? (y/n): ',
		)
		if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
			console.log('👋 Exiting without reviewing commits')
			return {
				appliedCount: 0,
				skippedCount: 0,
				totalReviewed: 0,
				hasChanges: false,
			}
		}

		let appliedCount = 0
		let skippedCount = 0

		for (let i = 0; i < commits.length; i++) {
			const commit = commits[i]
			if (!commit) continue

			const sequence = i + 1
			const total = commits.length
			const decision = await this.reviewCommit(commit, sequence, total)

			if (decision === 'quit') {
				console.log('👋 Stopping review process')
				break
			}

			if (decision === 'skip') {
				console.log('⏭️  Skipping remaining commits')
				break
			}

			if (decision === true) {
				const result = await this.gitOperations.applyCommit(
					commit.hash,
					this.promptUser.bind(this),
				)
				if (result.success) {
					appliedCount++
					// Update tracking to this commit
					this.configManager.updateEpicStackConfig(commit.hash, commit.date)
					console.log(`📝 Updated tracking to commit ${commit.hash}`)
				} else if (result.skipped) {
					skippedCount++
				}
			} else {
				skippedCount++
			}
		}

		const summary: UpdateSummary = {
			appliedCount,
			skippedCount,
			totalReviewed: appliedCount + skippedCount,
			hasChanges: appliedCount > 0,
		}

		this.displaySummary(summary)
		return summary
	}

	/**
	 * Displays commits in a formatted table before starting the review process.
	 * Shows commits in chronological order (oldest first) with sequence numbers.
	 * Shows commit hash, message, author, date, PR number, file count, and PR link.
	 *
	 * @param commits - Array of commits to display in chronological order
	 * @param pullRequestsOnly - Whether only PR commits are being shown
	 */
	private displayCommitsTable(
		commits: CommitInfo[],
		pullRequestsOnly: boolean = false,
	): void {
		const filterText = pullRequestsOnly ? ' Pull Requests' : ''
		console.log(`\n📋 Commits to Review${filterText} (in chronological order):`)
		console.log('='.repeat(190))

		// Table header
		console.log(
			`${'#'.padEnd(3)} ${'Hash'.padEnd(10)} ${'PR'.padEnd(6)} ${'Author'.padEnd(20)} ${'Date'.padEnd(12)} ${'Files'.padEnd(6)} ${'Message'.padEnd(40)} ${'PR Link'}`,
		)
		console.log('-'.repeat(190))

		// Display each commit with sequence number
		for (let i = 0; i < commits.length; i++) {
			const commit = commits[i]
			if (!commit) continue

			const details = this.commitParser.getCommitDetails(commit.hash)
			const fileCount = details.files.length

			const seq = (i + 1).toString().padEnd(3)
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
				`${seq} ${hash} ${pr} ${author} ${date} ${files} ${message} ${prLink}`,
			)
		}

		console.log('-'.repeat(190))
		const summaryText = pullRequestsOnly ? 'Pull Request commits' : 'commits'
		console.log(`Total: ${commits.length} ${summaryText} (oldest to newest)`)
	}

	/**
	 * Presents commit information to the user and prompts for a decision.
	 * Shows commit details including sequence number, hash, message, author, date, PR link, and file changes.
	 *
	 * @param commit - The commit information to review
	 * @param sequence - The sequence number of this commit in chronological order
	 * @param total - The total number of commits to review
	 * @returns Promise resolving to user's decision: true (apply), false (skip), 'skip' (skip remaining), or 'quit'
	 */
	private async reviewCommit(
		commit: CommitInfo,
		sequence: number,
		total: number,
	): Promise<boolean | string> {
		console.log('\n' + '='.repeat(80))
		console.log(`📋 Commit ${sequence}/${total}: ${commit.hash}`)
		console.log(`📝 Message: ${commit.message}`)
		console.log(`👤 Author: ${commit.author}`)
		console.log(`📅 Date: ${commit.date}`)
		if (commit.pr) {
			console.log(
				`🔗 PR: https://github.com/epicweb-dev/epic-stack/pull/${commit.pr}`,
			)
		}

		const details = this.commitParser.getCommitDetails(commit.hash)
		console.log(`📁 Files changed: ${details.files.length}`)

		// Show dependency conflict warning
		if (this.commitParser.hasDependencyConflicts(commit.hash)) {
			console.log(
				'⚠️  WARNING: This commit modifies dependencies - may cause conflicts!',
			)
		}

		// Show package-lock.json only warning
		if (this.commitParser.isPackageLockOnlyCommit(commit.hash)) {
			console.log(
				'📦 This commit only affects package-lock.json - safe to auto-resolve conflicts',
			)
		}

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
					return this.reviewCommit(commit, sequence, total) // Re-prompt after opening PR
				} else {
					console.log('❌ No PR associated with this commit')
					return this.reviewCommit(commit, sequence, total)
				}
			default:
				console.log('Invalid choice. Please enter y/n/s/q/o')
				return this.reviewCommit(commit, sequence, total)
		}
	}

	/**
	 * Opens a pull request URL in the default web browser.
	 *
	 * @param prNumber - The pull request number
	 */
	private openPRInBrowser(prNumber: string): void {
		const url = `https://github.com/epicweb-dev/epic-stack/pull/${prNumber}`
		try {
			const { execSync } = require('child_process')
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
	 * @param question - The question to ask the user
	 * @returns Promise resolving to the user's trimmed response
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
	 * Displays a summary of the update process results
	 *
	 * @param summary - The update summary to display
	 */
	private displaySummary(summary: UpdateSummary): void {
		console.log('\n📊 Summary:')
		console.log(`✅ Applied: ${summary.appliedCount}`)
		console.log(`⏭️  Skipped: ${summary.skippedCount}`)
		console.log(`📋 Total reviewed: ${summary.totalReviewed}`)

		if (summary.hasChanges) {
			console.log("\n🧪 Don't forget to test your changes!")
			console.log('   npm run build')
			console.log('   npm run dev')
			console.log('   npm run test')
		}
	}
}

/**
 * Creates and runs the Epic Stack updater instance.
 * This is the main entry point for the CLI application.
 *
 * @example
 * ```bash
 * npm run update:epic-stack
 * ```
 */
const updater = new EpicStackUpdater()
updater.run().catch(console.error)
