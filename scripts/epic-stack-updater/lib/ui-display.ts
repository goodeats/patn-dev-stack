/**
 * Epic Stack Updater Library - UI Display Module
 *
 * This module handles all console output, table formatting, and display logic
 * for the Epic Stack updater. It provides a clean separation between business
 * logic and presentation concerns.
 */

import  { type CommitInfo, type UpdateSummary } from './types.js'

/**
 * Handles all UI display and formatting for the Epic Stack updater
 */
export class UIDisplay {
	/**
	 * Displays the main application header
	 */
	displayHeader(): void {
		console.log('🚀 Epic Stack Updater')
		console.log('==================')
	}

	/**
	 * Displays current tracking information
	 *
	 * @param config - The current Epic Stack configuration
	 */
	displayTrackingInfo(config: { head: string; date: string }): void {
		console.log(`📍 Last tracked commit: ${config.head || 'none'}`)
		console.log(`📅 Last update: ${config.date || 'never'}`)
	}

	/**
	 * Displays the commits count and filter information
	 *
	 * @param count - Number of commits found
	 * @param pullRequestsOnly - Whether only PR commits are being shown
	 */
	displayCommitsCount(count: number, pullRequestsOnly: boolean): void {
		const filterText = pullRequestsOnly ? ' Pull Request commits' : ' commits'
		console.log(`📊 Found ${count} new${filterText} to review`)
	}

	/**
	 * Displays commits in a formatted table before starting the review process.
	 * Shows commits in chronological order (oldest first) with sequence numbers.
	 * Shows commit hash, message, author, date, PR number, file count, and PR link.
	 *
	 * @param commits - Array of commits to display in chronological order
	 * @param pullRequestsOnly - Whether only PR commits are being shown
	 * @param getCommitDetails - Function to get commit details for file count
	 */
	displayCommitsTable(
		commits: CommitInfo[],
		pullRequestsOnly: boolean,
		getCommitDetails: (hash: string) => { files: string[] },
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

			const details = getCommitDetails(commit.hash)
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
	 * Displays detailed commit information for review
	 *
	 * @param commit - The commit information to display
	 * @param sequence - The sequence number of this commit
	 * @param total - The total number of commits to review
	 * @param details - The commit details including files and diff
	 * @param warnings - Array of warning messages to display
	 */
	displayCommitReview(
		commit: CommitInfo,
		sequence: number,
		total: number,
		details: { files: string[]; diff: string },
		warnings: string[] = [],
	): void {
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

		console.log(`📁 Files changed: ${details.files.length}`)

		// Display warnings
		warnings.forEach((warning) => console.log(warning))

		console.log('📊 Changes:')
		console.log(details.diff)
	}

	/**
	 * Displays a summary of the update process results
	 *
	 * @param summary - The update summary to display
	 */
	displaySummary(summary: UpdateSummary): void {
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

	/**
	 * Displays a message when no commits are found
	 */
	displayNoCommitsFound(): void {
		console.log('✅ No new commits to review!')
	}

	/**
	 * Displays a message when exiting without reviewing
	 */
	displayExitingWithoutReview(): void {
		console.log('👋 Exiting without reviewing commits')
	}

	/**
	 * Displays a message when stopping the review process
	 */
	displayStoppingReview(): void {
		console.log('👋 Stopping review process')
	}

	/**
	 * Displays a message when skipping remaining commits
	 */
	displaySkippingRemaining(): void {
		console.log('⏭️  Skipping remaining commits')
	}

	/**
	 * Displays a message when updating tracking
	 *
	 * @param hash - The commit hash being tracked
	 */
	displayTrackingUpdate(hash: string): void {
		console.log(`📝 Updated tracking to commit ${hash}`)
	}

	/**
	 * Displays a message when opening a PR in browser
	 *
	 * @param prNumber - The PR number
	 */
	displayPRBrowserOpened(prNumber: string): void {
		console.log(`🌐 Opened PR #${prNumber} in browser`)
	}

	/**
	 * Displays a message when PR opening fails
	 *
	 * @param prNumber - The PR number
	 * @param url - The PR URL
	 */
	displayPRBrowserFailed(prNumber: string, url: string): void {
		console.log(`🔗 PR #${prNumber}: ${url}`)
		console.log('   (Copy the URL above to open in your browser)')
	}

	/**
	 * Displays a message when no PR is associated with a commit
	 */
	displayNoPRAssociated(): void {
		console.log('❌ No PR associated with this commit')
	}

	/**
	 * Displays an invalid choice message
	 */
	displayInvalidChoice(): void {
		console.log('Invalid choice. Please enter y/n/s/q/o')
	}
}
