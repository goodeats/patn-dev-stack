/**
 * Epic Stack Updater Library - Type Definitions
 *
 * This module contains all TypeScript interfaces and types used throughout
 * the Epic Stack updater library.
 */

/**
 * Configuration object for tracking Epic Stack updates in package.json
 */
export interface EpicStackConfig {
	/** The commit hash of the last processed Epic Stack commit */
	head: string
	/** The date of the last update in ISO format */
	date: string
}

/**
 * Information about a commit from the Epic Stack repository
 */
export interface CommitInfo {
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
 * Detailed information about a specific commit including changed files and diff statistics
 */
export interface CommitDetails {
	/** Array of changed file paths */
	files: string[]
	/** Git diff statistics output */
	diff: string
}

/**
 * Options for configuring the Epic Stack updater
 */
export interface UpdaterOptions {
	/** Path to the package.json file for tracking configuration */
	packageJsonPath?: string
	/** Name of the git remote for the upstream Epic Stack repository */
	upstreamRemote?: string
	/** URL of the Epic Stack repository */
	upstreamUrl?: string
}

/**
 * Result of applying a commit
 */
export interface ApplyResult {
	/** Whether the commit was successfully applied */
	success: boolean
	/** Any error message if the application failed */
	error?: string
	/** Whether the commit was skipped */
	skipped?: boolean
}

/**
 * Summary of the update process
 */
export interface UpdateSummary {
	/** Number of commits successfully applied */
	appliedCount: number
	/** Number of commits skipped */
	skippedCount: number
	/** Total number of commits reviewed */
	totalReviewed: number
	/** Whether any commits were applied */
	hasChanges: boolean
}
