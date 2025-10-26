/**
 * Epic Stack Updater Library - Git Operations
 *
 * This module handles all git operations including conflict resolution,
 * cherry-picking, and intelligent package-lock.json handling.
 */

import { execSync } from 'child_process'
import type { ApplyResult } from './types.js'
import { CommitParser } from './commit-parser.js'

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
	) {
		this.commitParser = new CommitParser(upstreamRemote)
	}

	private commitParser: CommitParser

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
	 * @param autoResolve - Whether to automatically resolve package conflicts
	 * @returns Promise resolving to ApplyResult indicating success/failure
	 */
	async applyCommit(
		hash: string,
		promptUser: (question: string) => Promise<string>,
		autoResolve: boolean = false,
	): Promise<ApplyResult> {
		// Check if commit is already applied
		if (this.isCommitAlreadyApplied(hash)) {
			console.log(`✅ Commit ${hash} already applied, skipping`)
			return { success: true, skipped: true }
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

			// Check if we're in a cherry-pick state and handle conflicts automatically
			try {
				const status = execSync('git status --porcelain', { encoding: 'utf8' })
				if (status.includes('CHERRY_PICKING')) {
					console.log(
						'🔄 Currently in cherry-pick state - attempting automatic resolution...',
					)

					// Check if this commit affects package files
					if (this.commitParser.affectsPackageFiles(hash)) {
						console.log(
							'📦 This commit affects package files - attempting auto-resolution...',
						)

						// Try automatic resolution first (or if autoResolve is enabled)
						if (
							autoResolve ||
							this.commitParser.isPackageLockOnlyCommit(hash)
						) {
							const autoResolved = await this.attemptAutomaticResolution(hash)
							if (autoResolved) {
								console.log(
									`✅ Successfully applied commit ${hash} with automatic resolution`,
								)
								return { success: true }
							}
						}
					}

					// If automatic resolution failed, provide manual options
					console.log(
						'⚠️  Automatic resolution failed. Manual intervention required:',
					)
					console.log(
						'   1. Resolve conflicts manually and run: git cherry-pick --continue',
					)
					console.log('   2. Skip this commit: git cherry-pick --skip')
					console.log('   3. Abort cherry-pick: git cherry-pick --abort')

					const answer = await promptUser(
						'❓ What would you like to do? (continue/skip/abort): ',
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
	 * Attempts automatic resolution of conflicts based on the commit type.
	 * This is the main entry point for automatic conflict resolution.
	 *
	 * @param hash - The commit hash being applied
	 * @returns Promise resolving to true if resolution was successful, false otherwise
	 */
	private async attemptAutomaticResolution(hash: string): Promise<boolean> {
		try {
			// Check what files are in conflict
			const conflictedFiles = this.getConflictedFiles()

			if (conflictedFiles.length === 0) {
				console.log('🔍 No conflicted files detected')
				return false
			}

			console.log(`🔍 Detected conflicts in: ${conflictedFiles.join(', ')}`)

			// Handle package.json conflicts by accepting incoming changes and regenerating lock file
			if (conflictedFiles.includes('package.json')) {
				console.log(
					'📦 Resolving package.json conflicts by accepting incoming changes...',
				)

				// Accept incoming changes for package.json
				execSync('git checkout --theirs package.json')

				// Regenerate package-lock.json from the new package.json
				console.log(
					'📦 Regenerating package-lock.json from updated package.json...',
				)
				execSync('rm -f package-lock.json')
				execSync('npm install --package-lock-only')

				// Stage the resolved files
				execSync('git add package.json package-lock.json')

				// Continue the cherry-pick
				execSync('git cherry-pick --continue')

				console.log('✅ Successfully resolved package conflicts automatically')
				return true
			}

			// Handle package-lock.json only conflicts
			if (
				conflictedFiles.includes('package-lock.json') &&
				!conflictedFiles.includes('package.json')
			) {
				console.log(
					'📦 Resolving package-lock.json conflicts by regenerating...',
				)

				// Accept incoming changes for package-lock.json
				execSync('git checkout --theirs package-lock.json')

				// Stage the resolved file
				execSync('git add package-lock.json')

				// Continue the cherry-pick
				execSync('git cherry-pick --continue')

				console.log(
					'✅ Successfully resolved package-lock.json conflicts automatically',
				)
				return true
			}

			// For other file types, we can't automatically resolve
			console.log(
				'⚠️  Cannot automatically resolve conflicts in:',
				conflictedFiles.join(', '),
			)
			return false
		} catch (error) {
			console.error('❌ Automatic resolution failed:', error)
			return false
		}
	}

	/**
	 * Gets the list of files currently in conflict during cherry-pick.
	 *
	 * @returns Array of file paths that are in conflict
	 */
	private getConflictedFiles(): string[] {
		try {
			const status = execSync('git status --porcelain', { encoding: 'utf8' })
			const conflictedFiles: string[] = []

			status.split('\n').forEach((line) => {
				if (line.includes('UU') || line.includes('AA') || line.includes('DD')) {
					const file = line.substring(3).trim()
					conflictedFiles.push(file)
				}
			})

			return conflictedFiles
		} catch (error) {
			console.error('❌ Failed to get conflicted files:', error)
			return []
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
	 * Automatically resolves package conflicts by running npm install.
	 * This handles conflicts in both package.json and package-lock.json.
	 *
	 * @returns Promise resolving to true if resolution was successful, false otherwise
	 */
	private async resolvePackageConflicts(): Promise<boolean> {
		try {
			console.log('🔧 Detected package conflicts - running npm install...')

			// Run npm install to resolve package conflicts
			console.log('📦 Running npm install to resolve package conflicts...')
			execSync('npm install')

			console.log('✅ Successfully resolved package conflicts with npm install')
			return true
		} catch (error) {
			console.error('❌ Failed to resolve package conflicts:', error)
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
		return this.commitParser.isCommitAlreadyApplied(hash)
	}

	/**
	 * Checks if a commit only affects package-lock.json and provides smart resolution.
	 * This helps avoid unnecessary conflicts when the lock file is regenerated.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if commit only affects package-lock.json
	 */
	private isPackageLockOnlyCommit(hash: string): boolean {
		return this.commitParser.isPackageLockOnlyCommit(hash)
	}

	/**
	 * Checks for potential dependency conflicts by comparing package.json changes.
	 * Warns user about potential conflicts before applying commits.
	 *
	 * @param hash - The commit hash to check
	 * @returns True if there are potential dependency conflicts
	 */
	private hasDependencyConflicts(hash: string): boolean {
		return this.commitParser.hasDependencyConflicts(hash)
	}
}
