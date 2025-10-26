/**
 * Epic Stack Updater Library - Commit Parser
 *
 * This module handles parsing git log output and extracting commit information
 * from the Epic Stack repository.
 */

import { execSync } from 'child_process'
import type { CommitInfo, CommitDetails } from './types.js'

/**
 * Parses git log output and extracts commit information from the Epic Stack repository
 */
export class CommitParser {
	/**
	 * Creates a new CommitParser instance
	 *
	 * @param upstreamRemote - Name of the git remote for the upstream Epic Stack repository
	 */
	constructor(private upstreamRemote: string = 'upstream') {}

	/**
	 * Retrieves commits from the upstream repository since the last processed commit.
	 * Returns commits in chronological order (oldest first) to ensure proper sequential updates.
	 * If no previous commit is found, it returns the last 20 commits for initial setup.
	 *
	 * @param lastCommit - The hash of the last processed commit, or empty string if none
	 * @param pullRequestsOnly - If true, only return commits with associated PRs
	 * @returns Array of commit information objects in chronological order
	 */
	getCommitsSince(
		lastCommit: string,
		pullRequestsOnly: boolean = false,
	): CommitInfo[] {
		if (!lastCommit) {
			console.log('⚠️  No previous commit found. Showing last 20 commits.')
			const output = execSync(
				`git log ${this.upstreamRemote}/main --oneline -20 --format="%H|%s|%an|%ad" --date=short --reverse`,
				{ encoding: 'utf8' },
			)
			const commits = this.parseCommits(output)
			return this.processCommits(commits, pullRequestsOnly)
		}

		// Get commits after the last processed commit in chronological order
		const output = execSync(
			`git log ${this.upstreamRemote}/main --oneline --reverse --format="%H|%s|%an|%ad" --date=short ${lastCommit}..HEAD`,
			{ encoding: 'utf8' },
		)
		const commits = this.parseCommits(output)
		return this.processCommits(commits, pullRequestsOnly)
	}

	/**
	 * Parses git log output into structured CommitInfo objects.
	 * Extracts commit hash, message, author, date, and optional PR number.
	 *
	 * @param output - Raw git log output with pipe-separated values
	 * @returns Array of parsed commit information objects
	 */
	parseCommits(output: string): CommitInfo[] {
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
	 * Processes commits by removing duplicates and ensuring proper chronological sorting.
	 * Removes duplicate commits based on PR number (keeping the earliest occurrence)
	 * and sorts all commits by date to ensure proper chronological order.
	 *
	 * @param commits - Array of parsed commit information objects
	 * @param pullRequestsOnly - If true, only return commits with associated PRs
	 * @returns Array of processed commit information objects in chronological order
	 */
	private processCommits(
		commits: CommitInfo[],
		pullRequestsOnly: boolean,
	): CommitInfo[] {
		// Filter for PR commits if requested
		let filteredCommits = pullRequestsOnly
			? commits.filter((commit) => commit.pr)
			: commits

		// Remove duplicates based on PR number (keep the earliest occurrence)
		const seenPRs = new Set<string>()
		const deduplicatedCommits = filteredCommits.filter((commit) => {
			if (!commit.pr) return true // Keep commits without PR numbers
			if (seenPRs.has(commit.pr)) return false // Skip duplicate PR commits
			seenPRs.add(commit.pr)
			return true
		})

		// Sort by date to ensure proper chronological order
		return deduplicatedCommits.sort((a, b) => {
			const dateA = new Date(a.date)
			const dateB = new Date(b.date)
			return dateA.getTime() - dateB.getTime()
		})
	}

	/**
	 * Retrieves detailed information about a specific commit including changed files and diff statistics.
	 *
	 * @param hash - The commit hash to get details for
	 * @returns Object containing changed files array and diff statistics
	 */
	getCommitDetails(hash: string): CommitDetails {
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
	 * @param shortHash - The short commit hash (8 characters)
	 * @returns The full commit hash
	 */
	getFullCommitHash(shortHash: string): string {
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
	 * Checks if a commit has already been applied to the current branch.
	 * This prevents re-applying commits that were manually resolved.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if the commit is already applied, false otherwise
	 */
	isCommitAlreadyApplied(hash: string): boolean {
		try {
			const fullHash = this.getFullCommitHash(hash)
			// Check if the commit exists in our current branch history by looking for the full hash
			const output = execSync(`git log --oneline | grep "${hash}"`, {
				encoding: 'utf8',
			})
			return output.trim().length > 0
		} catch (error) {
			// If the command fails, the commit is not in our history
			return false
		}
	}

	/**
	 * Checks if a commit only affects package-lock.json and provides smart resolution.
	 * This helps avoid unnecessary conflicts when the lock file is regenerated.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if commit only affects package-lock.json
	 */
	isPackageLockOnlyCommit(hash: string): boolean {
		try {
			const fullHash = this.getFullCommitHash(hash)
			const files = execSync(
				`git diff-tree --no-commit-id --name-only -r ${fullHash}`,
				{ encoding: 'utf8' },
			)
				.trim()
				.split('\n')
				.filter(Boolean)

			return files.length === 1 && files[0] === 'package-lock.json'
		} catch (error) {
			return false
		}
	}

	/**
	 * Checks for potential dependency conflicts by comparing package.json changes.
	 * Warns user about potential conflicts before applying commits.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if there are potential dependency conflicts
	 */
	hasDependencyConflicts(hash: string): boolean {
		try {
			const fullHash = this.getFullCommitHash(hash)
			const packageJsonDiff = execSync(`git show ${fullHash} -- package.json`, {
				encoding: 'utf8',
			})

			// Check if the commit modifies dependencies in package.json
			return (
				packageJsonDiff.includes('"dependencies"') ||
				packageJsonDiff.includes('"devDependencies"') ||
				packageJsonDiff.includes('"peerDependencies"')
			)
		} catch (error) {
			return false
		}
	}
}
