# Epic Stack Updater Library

A modular TypeScript library for systematically reviewing and applying commits from the Epic Stack repository to your project.

## 🎯 Features

- **Flexible CLI**: Idempotent commands that work great for both humans and LLMs
- **Interactive Review**: Review each commit individually with full details
- **Smart Conflict Resolution**: Automatic package-lock.json conflict resolution
- **Pull Request Filtering**: Focus on meaningful changes by filtering to PRs only
- **Progress Tracking**: Resume from where you left off using package.json tracking
- **Dependency Warnings**: Get warned about potential conflicts before applying
- **Chronological Processing**: Apply commits in proper order to maintain project state

## 📁 Library Structure

```bash
scripts/epic-stack-updater/
├── cli.ts                      # New flexible CLI interface
├── index.ts                    # Original interactive flow
├── lib/
│   ├── types.ts               # TypeScript interfaces and types
│   ├── config-manager.ts      # Package.json configuration management
│   ├── commit-parser.ts       # Git log parsing and commit analysis
│   ├── git-operations.ts      # Git commands and conflict resolution
│   ├── ui-display.ts          # UI formatting and display
│   ├── user-interaction.ts    # User input handling
│   └── commit-reviewer.ts     # Commit review logic
└── README.md                  # This documentation
```

## 🚀 Usage

### New Flexible CLI (Recommended)

The new CLI provides discrete, idempotent commands that are perfect for automation and LLM interactions:

```bash
# List available PRs
npm run epic-stack-updater -- list --prs-only

# Show details about a specific commit
npm run epic-stack-updater -- show ec0efe56

# Apply a specific commit
npm run epic-stack-updater -- apply ec0efe56

# Check current status
npm run epic-stack-updater -- status

# Sync with upstream
npm run epic-stack-updater -- sync

# Get help
npm run epic-stack-updater -- help
```

### Original Interactive Flow

```bash
npm run update:epic-stack
```

### As a Library

```typescript
import { EpicStackUpdater } from './scripts/epic-stack-updater/index.js'

const updater = new EpicStackUpdater({
  packageJsonPath: './package.json',
  upstreamRemote: 'upstream',
  upstreamUrl: 'https://github.com/epicweb-dev/epic-stack.git'
})

const summary = await updater.run()
console.log(`Applied ${summary.appliedCount} commits`)
```

## 🔧 Configuration

The library uses configuration stored in your `package.json`:

```json
{
  "epic-stack": {
    "head": "391e502b",
    "date": "2025-05-06"
  }
}
```

## 📖 CLI Command Reference

### `list` - List Available Commits

List commits/PRs since your last update:

```bash
# List all commits
npm run epic-stack-updater -- list

# List only PRs
npm run epic-stack-updater -- list --prs-only

# Limit results
npm run epic-stack-updater -- list --prs-only --limit 5

# Show all commits (ignore tracking)
npm run epic-stack-updater -- list --all
```

**Options:**

- `--prs-only` - Show only Pull Request commits
- `--limit <N>` - Limit results to N commits
- `--all` - Show all commits, ignoring current tracking

### `show` - Show Commit Details

Display detailed information about a specific commit:

```bash
# Basic info
npm run epic-stack-updater -- show ec0efe56

# Include file list
npm run epic-stack-updater -- show ec0efe56 --files

# Include diff statistics
npm run epic-stack-updater -- show ec0efe56 --diff
```

**Options:**

- `--files` - Include list of changed files
- `--diff` - Include diff statistics

### `apply` - Apply a Commit

Apply a specific commit by its hash:

```bash
# Apply a commit
npm run epic-stack-updater -- apply ec0efe56

# Auto-resolve package-lock conflicts
npm run epic-stack-updater -- apply ec0efe56 --auto-resolve

# Apply without updating tracking
npm run epic-stack-updater -- apply ec0efe56 --no-track
```

**Options:**

- `--auto-resolve` - Automatically resolve package-lock.json conflicts
- `--no-track` - Don't update tracking after applying

### `status` - Check Status

Show your current Epic Stack tracking status and available updates:

```bash
npm run epic-stack-updater -- status
```

### `sync` - Sync with Upstream

Fetch the latest changes from the Epic Stack repository:

```bash
npm run epic-stack-updater -- sync
```

### `interactive` - Interactive Mode

Run the original interactive review flow:

```bash
npm run epic-stack-updater -- interactive
```

## 🎮 Interactive Mode Commands

During the interactive review process, you can use these commands:

- **`y`** - Apply this commit
- **`n`** - Skip this commit
- **`s`** - Skip remaining commits
- **`q`** - Quit the review process
- **`o`** - Open PR in browser

## 💡 Workflow Examples

### For Humans

**Typical workflow:**

```bash
# 1. Check what's available
npm run epic-stack-updater -- status

# 2. List PRs
npm run epic-stack-updater -- list --prs-only

# 3. Review a specific commit
npm run epic-stack-updater -- show ec0efe56

# 4. Apply it
npm run epic-stack-updater -- apply ec0efe56
```

**Or use interactive mode:**

```bash
npm run epic-stack-updater -- interactive
```

### For LLMs

The new CLI is designed to be LLM-friendly with discrete, idempotent commands:

```bash
# LLM can run this without getting stuck in interactive prompts
npm run epic-stack-updater -- list --prs-only --limit 10

# LLM can get details about a specific commit
npm run epic-stack-updater -- show ec0efe56

# LLM can apply a specific commit (with auto-resolve for package-lock)
npm run epic-stack-updater -- apply ec0efe56 --auto-resolve
```

Each command completes and returns, making it easy to chain operations or handle them programmatically.

## 🔄 Conflict Resolution

The library provides intelligent conflict resolution:

### Package-lock.json Conflicts

- **Auto-detection**: Identifies commits that only affect package-lock.json
- **Auto-resolution**: Regenerates lock file using `npm install --package-lock-only`
- **Safe operation**: No risk of losing dependency changes

### Dependency Conflicts

- **Pre-warning**: Alerts before applying commits that modify dependencies
- **Manual override**: Option to proceed despite warnings
- **Smart tracking**: Regenerates package-lock.json after tracking updates

## 📊 Module Responsibilities

### `ConfigManager`

- Reads/writes Epic Stack configuration from package.json
- Handles package-lock.json regeneration after config updates
- Provides safe file operations with error handling

### `CommitParser`

- Parses git log output into structured data
- Extracts PR numbers from commit messages
- Analyzes commit impact (dependencies, package-lock.json)
- Checks if commits are already applied

### `GitOperations`

- Manages git remote setup and fetching
- Handles cherry-pick operations with conflict resolution
- Provides intelligent conflict resolution strategies
- Manages git state during operations

## 🧪 Testing

Each module can be tested independently:

```typescript
import { ConfigManager } from './lib/config-manager.js'
import { CommitParser } from './lib/commit-parser.js'
import { GitOperations } from './lib/git-operations.js'

// Test configuration management
const configManager = new ConfigManager('./test-package.json')
const config = configManager.getEpicStackConfig()

// Test commit parsing
const commitParser = new CommitParser('upstream')
const commits = commitParser.getCommitsSince('abc123', true) // PRs only

// Test git operations
const gitOps = new GitOperations('upstream', 'https://github.com/epicweb-dev/epic-stack.git')
await gitOps.ensureUpstreamRemote()
```

## 🔮 Future Enhancements

This modular structure makes it easy to add new features:

- **Batch Operations**: Apply multiple commits at once
- **Custom Filters**: Filter by author, date range, or file patterns
- **Integration Hooks**: Pre/post apply hooks for custom logic
- **Configuration UI**: Interactive configuration management
- **Progress Persistence**: Save/restore review state
- **Plugin System**: Extensible architecture for custom behaviors

## 📦 Publishing as NPM Package

The modular structure is designed to be easily publishable:

1. **Add package.json** with proper metadata
2. **Configure build process** for TypeScript compilation
3. **Add comprehensive tests** for each module
4. **Create documentation** with examples
5. **Set up CI/CD** for automated publishing

## 🤝 Contributing

The modular structure makes contributions easier:

- **Single Responsibility**: Each module has a clear purpose
- **Type Safety**: Full TypeScript support with comprehensive types
- **Documentation**: JSDoc comments for all public APIs
- **Testing**: Each module can be tested independently

## 📄 License

MIT License - feel free to use this as a template for your own tools!
