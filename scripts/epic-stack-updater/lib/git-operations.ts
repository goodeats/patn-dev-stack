/**
 * Epic Stack Updater Library - Git Operations
 *
 * This module handles all git operations including conflict resolution,
 * cherry-picking, and intelligent package-lock.json handling.
 */

import { execSync } from 'child_process'
import type { ApplyResult } from './types.js'

/**
 * Handles git operations and conflict resolution for Epic Stack updates
 */
export class GitOperations {
	/**
	 * Creates a new GitOperations instance
	 *
	 * @param upstreamRemote - Name of the git remote for the upstream Epic Stack repository
	 * @param upstreamUrl - URL of the Epic Stack repository
	 */
	constructor(
		private upstreamRemote: string = 'upstream',
		private upstreamUrl: string = 'https://github.com/epicweb-dev/epic-stack.git',
	) {}

	/**
	 * Ensures the upstream remote is configured for the Epic Stack repository.
	 * If the remote doesn't exist, it will be added automatically.
	 *
	 * @throws {Error} Exits the process if remote setup fails
	 */
	ensureUpstreamRemote(): void {
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
	fetchLatest(): void {
		console.log('📥 Fetching latest changes from upstream...')
		try {
			execSync(`git fetch ${this.upstreamRemote}`)
		} catch (error) {
			console.error('❌ Failed to fetch from upstream:', error)
			process.exit(1)
		}
	}

	/**
	 * Applies a commit from the upstream repository to the current branch using cherry-pick.
	 * Uses intelligent conflict resolution for common scenarios like package-lock.json conflicts.
	 *
	 * @param hash - The commit hash to apply
	 * @param promptUser - Function to prompt user for input
	 * @returns Promise resolving to ApplyResult indicating success/failure
	 */
	async applyCommit(
		hash: string,
		promptUser: (question: string) => Promise<string>,
	): Promise<ApplyResult> {
		// Check if commit is already applied
		if (this.isCommitAlreadyApplied(hash)) {
			console.log(`✅ Commit ${hash} already applied, skipping`)
			return { success: true, skipped: true }
		}

		// Check for potential dependency conflicts before applying
		if (this.hasDependencyConflicts(hash)) {
			console.log(
				'⚠️  This commit modifies dependencies - potential conflicts ahead',
			)
			const proceed = await promptUser('❓ Continue anyway? (y/n): ')
			if (proceed.toLowerCase() !== 'y' && proceed.toLowerCase() !== 'yes') {
				console.log(`⏭️ Skipped commit ${hash} due to dependency concerns`)
				return { success: false, skipped: true }
			}
		}

		try {
			console.log(`🔄 Applying commit ${hash}...`)

			// Get full commit hash for git operations
			const fullHash = this.getFullCommitHash(hash)

			// Cherry-pick directly to current branch
			execSync(`git cherry-pick ${fullHash}`)

			console.log(`✅ Successfully applied commit ${hash}`)
			return { success: true }
		} catch (error) {
			console.error(`❌ Failed to apply commit ${hash}:`, error)

			// Check if we're in a cherry-pick state
			try {
				const status = execSync('git status --porcelain', { encoding: 'utf8' })
				if (status.includes('CHERRY_PICKING')) {
					console.log('🔄 Currently in cherry-pick state. Options:')

					// Check if this is a package-lock.json only commit
					if (this.isPackageLockOnlyCommit(hash)) {
						console.log('📦 This commit only affects package-lock.json')
						const autoResolve = await promptUser(
							'❓ Auto-resolve by regenerating package-lock.json? (y/n): ',
						)

						if (
							autoResolve.toLowerCase() === 'y' ||
							autoResolve.toLowerCase() === 'yes'
						) {
							const resolved = await this.resolvePackageLockConflict()
							if (resolved) {
								try {
									execSync('git add package-lock.json')
									execSync('git cherry-pick --continue')
									console.log(
										`✅ Successfully applied commit ${hash} with auto-resolved package-lock.json`,
									)
									return { success: true }
								} catch (continueError) {
									console.error(
										'❌ Cherry-pick continue failed after auto-resolution:',
										continueError,
									)
									return { success: false, error: String(continueError) }
								}
							}
						}
					}

					console.log(
						'   1. Resolve conflicts manually and run: git cherry-pick --continue',
					)
					console.log('   2. Skip this commit: git cherry-pick --skip')
					console.log('   3. Abort cherry-pick: git cherry-pick --abort')
					console.log(
						'   4. Auto-resolve package-lock.json conflicts: npm install --package-lock-only',
					)

					const answer = await promptUser(
						'❓ What would you like to do? (continue/skip/abort/auto-resolve): ',
					)

					switch (answer.toLowerCase()) {
						case 'continue':
							try {
								execSync('git cherry-pick --continue')
								console.log(`✅ Successfully applied commit ${hash}`)
								return { success: true }
							} catch (continueError) {
								console.error('❌ Cherry-pick continue failed:', continueError)
								return { success: false, error: String(continueError) }
							}
						case 'skip':
							try {
								execSync('git cherry-pick --skip')
								console.log(`⏭️ Skipped commit ${hash}`)
								return { success: false, skipped: true }
							} catch (skipError) {
								console.error('❌ Cherry-pick skip failed:', skipError)
								return { success: false, error: String(skipError) }
							}
						case 'abort':
							try {
								execSync('git cherry-pick --abort')
								console.log(`🛑 Aborted cherry-pick for commit ${hash}`)
								return { success: false, skipped: true }
							} catch (abortError) {
								console.error('❌ Cherry-pick abort failed:', abortError)
								return { success: false, error: String(abortError) }
							}
						case 'auto-resolve':
							const resolved = await this.resolvePackageLockConflict()
							if (resolved) {
								try {
									execSync('git add package-lock.json')
									execSync('git cherry-pick --continue')
									console.log(
										`✅ Successfully applied commit ${hash} with auto-resolved package-lock.json`,
									)
									return { success: true }
								} catch (continueError) {
									console.error(
										'❌ Cherry-pick continue failed after auto-resolution:',
										continueError,
									)
									return { success: false, error: String(continueError) }
								}
							}
							return { success: false, error: 'Auto-resolution failed' }
						default:
							console.log('Invalid choice. Aborting cherry-pick.')
							try {
								execSync('git cherry-pick --abort')
							} catch {}
							return { success: false, error: 'Invalid choice' }
					}
				}
			} catch (statusError) {
				// If we can't check status, assume we're not in cherry-pick state
				console.log('⚠️ Could not check git status, assuming commit failed')
			}

			return { success: false, error: String(error) }
		}
	}

	/**
	 * Automatically resolves package-lock.json conflicts by regenerating the lock file.
	 * This is safe because package-lock.json should be regenerated from package.json.
	 *
	 * @returns Promise resolving to true if resolution was successful, false otherwise
	 */
	private async resolvePackageLockConflict(): Promise<boolean> {
		try {
			console.log(
				'🔧 Detected package-lock.json conflict - regenerating lock file...',
			)

			// Remove the conflicted package-lock.json
			execSync('rm -f package-lock.json')

			// Regenerate from package.json
			console.log('📦 Regenerating package-lock.json from package.json...')
			execSync('npm install --package-lock-only')

			console.log('✅ Successfully regenerated package-lock.json')
			return true
		} catch (error) {
			console.error('❌ Failed to regenerate package-lock.json:', error)
			return false
		}
	}

	/**
	 * Gets the full commit hash from a short hash.
	 * This is needed for git operations that require the full hash.
	 *
	 * @param shortHash - The short commit hash (8 characters)
	 * @returns The full commit hash
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
	 * Checks if a commit has already been applied to the current branch.
	 * This prevents re-applying commits that were manually resolved.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if the commit is already applied, false otherwise
	 */
	private isCommitAlreadyApplied(hash: string): boolean {
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
	private isPackageLockOnlyCommit(hash: string): boolean {
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
	private hasDependencyConflicts(hash: string): boolean {
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
