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
import { UIDisplay } from './lib/ui-display.js'
import { UserInteraction } from './lib/user-interaction.js'
import { CommitReviewer } from './lib/commit-reviewer.js'
import type { UpdateSummary, UpdaterOptions } from './lib/types.js'

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
	private uiDisplay: UIDisplay
	private userInteraction: UserInteraction
	private commitReviewer: CommitReviewer

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
		this.uiDisplay = new UIDisplay()
		this.userInteraction = new UserInteraction()
		this.commitReviewer = new CommitReviewer(
			(hash) => this.commitParser.getCommitDetails(hash),
			(hash) => this.commitParser.hasDependencyConflicts(hash),
			(hash) => this.commitParser.isPackageLockOnlyCommit(hash),
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
		this.uiDisplay.displayHeader()

		// Ensure upstream remote is configured
		this.gitOperations.ensureUpstreamRemote()

		// Fetch latest changes
		this.gitOperations.fetchLatest()

		// Get current tracking info
		const config = this.configManager.getEpicStackConfig()
		this.uiDisplay.displayTrackingInfo(config)

		// Ask user if they want to filter to only Pull Requests
		const filterPRs = await this.userInteraction.promptForPRFilter()

		// Get commits since last update
		const commits = this.commitParser.getCommitsSince(config.head, filterPRs)

		if (commits.length === 0) {
			this.uiDisplay.displayNoCommitsFound()
			return {
				appliedCount: 0,
				skippedCount: 0,
				totalReviewed: 0,
				hasChanges: false,
			}
		}

		this.uiDisplay.displayCommitsCount(commits.length, filterPRs)

		// Display commits table for overview
		this.uiDisplay.displayCommitsTable(commits, filterPRs, (hash) =>
			this.commitParser.getCommitDetails(hash),
		)

		// Ask user if they want to proceed with interactive review
		const proceed = await this.userInteraction.promptForInteractiveReview()
		if (!proceed) {
			this.uiDisplay.displayExitingWithoutReview()
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
			const reviewResult = await this.commitReviewer.reviewCommit(
				commit,
				sequence,
				total,
			)

			if (!reviewResult.shouldContinue) {
				break
			}

			if (CommitReviewer.shouldApplyCommit(reviewResult.decision)) {
				const result = await this.gitOperations.applyCommit(
					commit.hash,
					this.userInteraction.promptUser.bind(this.userInteraction),
				)
				if (result.success) {
					appliedCount++
					// Update tracking to this commit
					this.configManager.updateEpicStackConfig(commit.hash, commit.date)
					this.uiDisplay.displayTrackingUpdate(commit.hash)
				} else if (result.skipped) {
					skippedCount++
				}
			} else if (CommitReviewer.shouldSkipCommit(reviewResult.decision)) {
				skippedCount++
			}
		}

		const summary: UpdateSummary = {
			appliedCount,
			skippedCount,
			totalReviewed: appliedCount + skippedCount,
			hasChanges: appliedCount > 0,
		}

		this.uiDisplay.displaySummary(summary)
		return summary
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
// Only run if this file is being executed directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
	const updater = new EpicStackUpdater()
	updater.run().catch(console.error)
}
