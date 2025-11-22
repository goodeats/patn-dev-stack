/**
 * Epic Stack Updater Library - Commit Review Module
 *
 * This module handles the commit review workflow, including decision processing,
 * warning generation, and coordination between UI, user interaction, and git operations.
 */

import  { type CommitInfo, type CommitDetails } from './types.js'
import { UIDisplay } from './ui-display.js'
import { UserInteraction } from './user-interaction.js'

export type ReviewDecision = boolean | 'skip' | 'quit' | 'open'

export interface CommitReviewResult {
	decision: ReviewDecision
	shouldContinue: boolean
}

/**
 * Handles the commit review workflow and decision processing
 */
export class CommitReviewer {
	private uiDisplay: UIDisplay
	private userInteraction: UserInteraction

	constructor(
		private getCommitDetails: (hash: string) => CommitDetails,
		private hasDependencyConflicts: (hash: string) => boolean,
		private isPackageLockOnlyCommit: (hash: string) => boolean,
	) {
		this.uiDisplay = new UIDisplay()
		this.userInteraction = new UserInteraction()
	}

	/**
	 * Reviews a single commit and handles the user interaction workflow
	 *
	 * @param commit - The commit to review
	 * @param sequence - The sequence number of this commit
	 * @param total - The total number of commits to review
	 * @returns Promise resolving to the review result
	 */
	async reviewCommit(
		commit: CommitInfo,
		sequence: number,
		total: number,
	): Promise<CommitReviewResult> {
		const details = this.getCommitDetails(commit.hash)
		const warnings = this.generateWarnings(commit.hash)

		this.uiDisplay.displayCommitReview(
			commit,
			sequence,
			total,
			details,
			warnings,
		)

		let decision: ReviewDecision
		let shouldContinue = true

		do {
			const userDecision = await this.userInteraction.promptForCommitDecision()

			if (userDecision === 'open') {
				if (commit.pr) {
					const opened = await this.userInteraction.openPRInBrowser(commit.pr)
					if (opened) {
						this.uiDisplay.displayPRBrowserOpened(commit.pr)
					} else {
						this.uiDisplay.displayPRBrowserFailed(
							commit.pr,
							`https://github.com/epicweb-dev/epic-stack/pull/${commit.pr}`,
						)
					}
					// Re-prompt after opening PR
					continue
				} else {
					this.uiDisplay.displayNoPRAssociated()
					continue
				}
			}

			if (userDecision === 'invalid') {
				this.uiDisplay.displayInvalidChoice()
				continue
			}

			// Valid decision made
			decision = userDecision as ReviewDecision
			break
		} while (true)

		// Determine if we should continue processing commits
		if (decision === 'quit') {
			this.uiDisplay.displayStoppingReview()
			shouldContinue = false
		} else if (decision === 'skip') {
			this.uiDisplay.displaySkippingRemaining()
			shouldContinue = false
		}

		return { decision, shouldContinue }
	}

	/**
	 * Generates warning messages for a commit based on its characteristics
	 *
	 * @param hash - The commit hash to analyze
	 * @returns Array of warning messages
	 */
	private generateWarnings(hash: string): string[] {
		const warnings: string[] = []

		if (this.hasDependencyConflicts(hash)) {
			warnings.push(
				'⚠️  WARNING: This commit modifies dependencies - may cause conflicts!',
			)
		}

		if (this.isPackageLockOnlyCommit(hash)) {
			warnings.push(
				'📦 This commit only affects package-lock.json - safe to auto-resolve conflicts',
			)
		}

		return warnings
	}

	/**
	 * Checks if a decision should result in applying the commit
	 *
	 * @param decision - The user's decision
	 * @returns True if the commit should be applied
	 */
	static shouldApplyCommit(decision: ReviewDecision): boolean {
		return decision === true
	}

	/**
	 * Checks if a decision should result in skipping the commit
	 *
	 * @param decision - The user's decision
	 * @returns True if the commit should be skipped
	 */
	static shouldSkipCommit(decision: ReviewDecision): boolean {
		return decision === false
	}

	/**
	 * Checks if a decision should result in stopping the review process
	 *
	 * @param decision - The user's decision
	 * @returns True if the review process should stop
	 */
	static shouldStopReview(decision: ReviewDecision): boolean {
		return decision === 'quit' || decision === 'skip'
	}
}
