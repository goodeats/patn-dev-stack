#!/usr/bin/env tsx

/**
 * Epic Stack Updater CLI - Command-line Interface
 *
 * A flexible, idempotent CLI for managing Epic Stack updates.
 * Designed to work seamlessly with both humans and LLMs.
 *
 * Commands:
 *   list [--prs-only] [--limit N]     List available commits/PRs
 *   show <hash>                       Show detailed info about a commit
 *   apply <hash> [--auto-resolve]     Apply a specific commit
 *   status                            Show current tracking status
 *   sync                              Fetch latest from upstream
 *   interactive                       Run the original interactive flow
 *
 * Examples:
 *   npm run epic-stack-updater -- list --prs-only
 *   npm run epic-stack-updater -- show ec0efe56
 *   npm run epic-stack-updater -- apply ec0efe56
 *   npm run epic-stack-updater -- status
 */

import { parseArgs } from 'node:util'
import { ConfigManager } from './lib/config-manager.js'
import { CommitParser } from './lib/commit-parser.js'
import { GitOperations } from './lib/git-operations.js'
import { UIDisplay } from './lib/ui-display.js'
import { EpicStackUpdater } from './index.js'

interface CLIOptions {
	packageJsonPath?: string
	upstreamRemote?: string
	upstreamUrl?: string
}

class EpicStackCLI {
	private configManager: ConfigManager
	private commitParser: CommitParser
	private gitOperations: GitOperations
	private uiDisplay: UIDisplay

	constructor(options: CLIOptions = {}) {
		this.configManager = new ConfigManager(
			options.packageJsonPath || './package.json',
		)
		this.commitParser = new CommitParser(options.upstreamRemote || 'upstream')
		this.gitOperations = new GitOperations(
			options.upstreamRemote || 'upstream',
			options.upstreamUrl || 'https://github.com/epicweb-dev/epic-stack.git',
		)
		this.uiDisplay = new UIDisplay()
	}

	/**
	 * Display help information
	 */
	displayHelp(): void {
		console.log(`
🚀 Epic Stack Updater CLI

USAGE:
  npm run epic-stack-updater -- <command> [options]

COMMANDS:
  list [options]              List available commits/PRs since last update
    --prs-only                Show only Pull Request commits
    --limit <N>               Limit results to N commits
    --all                     Show all commits (ignore tracking)

  show <hash>                 Show detailed information about a commit
    --files                   Include list of changed files
    --diff                    Include diff statistics

  apply <hash> [options]      Apply a specific commit by hash
    --auto-resolve            Auto-resolve package-lock conflicts
    --no-track                Don't update tracking after apply

  status                      Show current Epic Stack tracking status

  sync                        Fetch latest changes from upstream

  interactive                 Run the original interactive review flow

  help                        Show this help message

EXAMPLES:
  # List all PRs since last update
  npm run epic-stack-updater -- list --prs-only

  # Show details about a specific commit
  npm run epic-stack-updater -- show ec0efe56

  # Apply a specific commit
  npm run epic-stack-updater -- apply ec0efe56

  # Check current status
  npm run epic-stack-updater -- status

  # Sync with upstream
  npm run epic-stack-updater -- sync
`)
		process.exit(0)
	}

	/**
	 * List available commits/PRs
	 */
	async listCommits(args: string[]): Promise<void> {
		const { values } = parseArgs({
			args,
			options: {
				'prs-only': { type: 'boolean', default: false },
				limit: { type: 'string' },
				all: { type: 'boolean', default: false },
			},
			allowPositionals: true,
		})

		const prsOnly = values['prs-only'] as boolean
		const limit = values.limit
			? parseInt(values.limit as string, 10)
			: undefined
		const showAll = values.all as boolean

		// Ensure we have latest data
		this.gitOperations.ensureUpstreamRemote()
		console.log('📥 Fetching latest changes from upstream...')
		this.gitOperations.fetchLatest()

		const config = this.configManager.getEpicStackConfig()

		if (!showAll) {
			console.log(`\n📍 Current tracking:`)
			console.log(`   Head: ${config.head}`)
			console.log(`   Date: ${config.date}`)
		}

		const commits = showAll
			? this.commitParser.getAllCommits(prsOnly, limit)
			: this.commitParser.getCommitsSince(config.head, prsOnly, limit)

		if (commits.length === 0) {
			console.log('\n✅ No new commits found. You are up to date!')
			return
		}

		console.log(
			`\n📊 Found ${commits.length} ${prsOnly ? 'PR' : ''} commit${commits.length === 1 ? '' : 's'}${showAll ? '' : ' since last update'}\n`,
		)

		this.uiDisplay.displayCommitsTable(commits, prsOnly, (hash) =>
			this.commitParser.getCommitDetails(hash),
		)

		console.log(
			'\n💡 Use "npm run epic-stack-updater -- show <hash>" for details',
		)
		console.log(
			'💡 Use "npm run epic-stack-updater -- apply <hash>" to apply a commit',
		)
	}

	/**
	 * Show detailed information about a specific commit
	 */
	async showCommit(args: string[]): Promise<void> {
		const { values, positionals } = parseArgs({
			args,
			options: {
				files: { type: 'boolean', default: false },
				diff: { type: 'boolean', default: false },
			},
			allowPositionals: true,
		})

		const hash = positionals[0]
		if (!hash) {
			console.error('❌ Error: Commit hash is required')
			console.log('Usage: npm run epic-stack-updater -- show <hash>')
			process.exit(1)
		}

		const showFiles = values.files as boolean
		const showDiff = values.diff as boolean

		// Get commit info
		const commits = this.commitParser.getAllCommits(false, 1000)
		const commit = commits.find((c) => c.hash.startsWith(hash))

		if (!commit) {
			console.error(`❌ Error: Commit ${hash} not found`)
			process.exit(1)
		}

		// Display commit info
		console.log('\n📋 Commit Information')
		console.log('='.repeat(60))
		console.log(`Hash:    ${commit.hash}`)
		console.log(`Author:  ${commit.author}`)
		console.log(`Date:    ${commit.date}`)
		if (commit.pr) {
			console.log(`PR:      #${commit.pr}`)
			console.log(
				`Link:    https://github.com/epicweb-dev/epic-stack/pull/${commit.pr}`,
			)
		}
		console.log(`Message: ${commit.message}`)

		// Get detailed info
		const details = this.commitParser.getCommitDetails(commit.hash)

		// Check for special characteristics
		const isPackageLockOnly = this.commitParser.isPackageLockOnlyCommit(
			commit.hash,
		)
		const hasDependencyConflicts = this.commitParser.hasDependencyConflicts(
			commit.hash,
		)

		if (isPackageLockOnly) {
			console.log('\n⚠️  This commit only modifies package-lock.json')
			console.log('   (Can be auto-resolved with --auto-resolve)')
		}

		if (hasDependencyConflicts) {
			console.log('\n⚠️  This commit modifies package.json dependencies')
			console.log('   (May require manual conflict resolution)')
		}

		console.log(`\n📁 Files changed: ${details.files.length}`)

		if (showFiles || details.files.length <= 10) {
			console.log('\nChanged files:')
			details.files.forEach((file) => console.log(`  - ${file}`))
		}

		if (showDiff) {
			console.log('\n📊 Diff Statistics:')
			console.log(details.diff)
		}

		console.log(
			`\n💡 Apply this commit: npm run epic-stack-updater -- apply ${commit.hash}`,
		)
	}

	/**
	 * Apply a specific commit by hash
	 */
	async applyCommit(args: string[]): Promise<void> {
		const { values, positionals } = parseArgs({
			args,
			options: {
				'auto-resolve': { type: 'boolean', default: false },
				'no-track': { type: 'boolean', default: false },
			},
			allowPositionals: true,
		})

		const hash = positionals[0]
		if (!hash) {
			console.error('❌ Error: Commit hash is required')
			console.log('Usage: npm run epic-stack-updater -- apply <hash>')
			process.exit(1)
		}

		const autoResolve = values['auto-resolve'] as boolean
		const noTrack = values['no-track'] as boolean

		// Ensure upstream is set up
		this.gitOperations.ensureUpstreamRemote()

		// Find the commit
		const commits = this.commitParser.getAllCommits(false, 1000)
		const commit = commits.find((c) => c.hash.startsWith(hash))

		if (!commit) {
			console.error(`❌ Error: Commit ${hash} not found`)
			process.exit(1)
		}

		console.log(`\n🔄 Applying commit ${commit.hash}...`)
		console.log(`   ${commit.message}`)

		// Check for special cases
		const isPackageLockOnly = this.commitParser.isPackageLockOnlyCommit(
			commit.hash,
		)
		const hasDependencyConflicts = this.commitParser.hasDependencyConflicts(
			commit.hash,
		)

		if (hasDependencyConflicts && !autoResolve) {
			console.log(
				'\n⚠️  Warning: This commit modifies dependencies and may cause conflicts.',
			)
			console.log(
				'   Use --auto-resolve to automatically handle package-lock.json conflicts.',
			)
		}

		// Apply the commit
		const result = await this.gitOperations.applyCommit(
			commit.hash,
			async (prompt: string) => {
				// For non-interactive mode, we'll use sensible defaults
				if (autoResolve && isPackageLockOnly) {
					return 'y' // Auto-accept package-lock resolution
				}
				// For other prompts, we need user input
				const readline = await import('readline')
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout,
				})

				return new Promise<string>((resolve) => {
					rl.question(prompt, (answer) => {
						rl.close()
						resolve(answer.trim().toLowerCase())
					})
				})
			},
		)

		if (result.success) {
			console.log(`✅ Successfully applied commit ${commit.hash}`)

			if (!noTrack) {
				// Update tracking
				this.configManager.updateEpicStackConfig(commit.hash, commit.date)
				console.log(`📍 Updated tracking to ${commit.hash}`)
			}
		} else if (result.skipped) {
			console.log(`⏭️  Skipped commit ${commit.hash}`)
		} else {
			console.error(`❌ Failed to apply commit ${commit.hash}`)
			if (result.error) {
				console.error(`   Error: ${result.error}`)
			}
			process.exit(1)
		}
	}

	/**
	 * Show current tracking status
	 */
	async status(): Promise<void> {
		const config = this.configManager.getEpicStackConfig()

		console.log('\n📊 Epic Stack Status')
		console.log('='.repeat(60))

		if (!config.head) {
			console.log('⚠️  No tracking information found')
			console.log(
				'   Run "npm run epic-stack-updater -- sync" to fetch upstream changes',
			)
			return
		}

		console.log(`Current Head: ${config.head}`)
		console.log(`Last Update:  ${config.date}`)

		// Check for new commits
		this.gitOperations.ensureUpstreamRemote()
		const commits = this.commitParser.getCommitsSince(config.head, false)

		console.log(`\n📈 Available Updates:`)
		console.log(
			`   ${commits.length} new commit${commits.length === 1 ? '' : 's'} available`,
		)

		const prCommits = this.commitParser.getCommitsSince(config.head, true)
		console.log(
			`   ${prCommits.length} Pull Request${prCommits.length === 1 ? '' : 's'}`,
		)

		if (commits.length > 0) {
			console.log(
				'\n💡 Run "npm run epic-stack-updater -- list" to see available updates',
			)
			console.log(
				'💡 Run "npm run epic-stack-updater -- list --prs-only" to see only PRs',
			)
		} else {
			console.log('\n✅ You are up to date!')
		}
	}

	/**
	 * Sync with upstream (fetch latest changes)
	 */
	async sync(): Promise<void> {
		console.log('📥 Syncing with upstream Epic Stack...')

		this.gitOperations.ensureUpstreamRemote()
		this.gitOperations.fetchLatest()

		console.log('✅ Sync complete!')
		console.log(
			'\n💡 Run "npm run epic-stack-updater -- status" to see available updates',
		)
	}

	/**
	 * Run the original interactive flow
	 */
	async interactive(): Promise<void> {
		console.log('🔄 Starting interactive review mode...\n')
		const updater = new EpicStackUpdater()
		await updater.run()
	}

	/**
	 * Main CLI entry point
	 */
	async run(): Promise<void> {
		const args = process.argv.slice(2)

		if (args.length === 0 || args[0] === 'help' || args[0] === '--help') {
			this.displayHelp()
			return
		}

		const command = args[0]
		const commandArgs = args.slice(1)

		try {
			switch (command) {
				case 'list':
					await this.listCommits(commandArgs)
					break
				case 'show':
					await this.showCommit(commandArgs)
					break
				case 'apply':
					await this.applyCommit(commandArgs)
					break
				case 'status':
					await this.status()
					break
				case 'sync':
					await this.sync()
					break
				case 'interactive':
					await this.interactive()
					break
				default:
					console.error(`❌ Unknown command: ${command}`)
					console.log(
						'Run "npm run epic-stack-updater -- help" for usage information',
					)
					process.exit(1)
			}
		} catch (error) {
			console.error('❌ Error:', error instanceof Error ? error.message : error)
			process.exit(1)
		}
	}
}

// Run the CLI
const cli = new EpicStackCLI()
cli.run().catch(console.error)
