# Example Repositories for LLM Coding Assistants

This directory is for cloning other repositories to use as examples when coding with LLM assistants like Cursor or Claude Code.

## Purpose

When working with AI coding assistants, it can be helpful to have reference implementations from other projects. Clone repositories here that demonstrate patterns, architectures, or implementations you want to reference. The assistant can then search the web for relevant examples and suggest cloning them into this directory for future reference.

## Quick Start for LLM Assistants

**For developers using this with an AI coding assistant:**

Copy this entire README into your chat with the AI assistant and ask it to:

1. Create cursor rules (`.cursorrules` or add to `.cursor/rules/`) that adopt the policies described here
2. Understand how to use the `.repos` directory for reference implementations
3. Suggest searching the web for relevant repository examples when working on features
4. Automatically catalog and log repository usage as described below

**For AI assistants reading this:**

You should:

- **Proactively suggest** searching the web for relevant repository examples when the user is implementing features
- **Recommend cloning** helpful repositories into `.repos/` for future reference
- **Automatically catalog** repositories when they are cloned (see Repository Catalog section)
- **Log usage** whenever you reference code from cloned repositories (see Usage Logging section)
- **Reference the catalog** to find existing examples before suggesting new clones

## Usage

### Cloning Repositories

1. Clone repositories into this directory:

   ```bash
   cd .repos
   git clone https://github.com/example/repo-name.git
   ```

2. After cloning, the repository should be automatically cataloged (see Repository Catalog section below).

3. The LLM assistant can then reference code from these repositories when helping implement similar features.

### AI Assistant Workflow

When working on a feature or pattern:

1. **Check the catalog first**: Search `.repos/catalog.csv` to see if relevant examples already exist
2. **Search the web if needed**: If no suitable examples exist, suggest searching GitHub/GitLab for relevant repositories
3. **Clone and catalog**: When a useful repo is found, clone it and add it to the catalog
4. **Log usage**: Whenever you reference code from a cloned repo, log the interaction

## Repository Catalog

The repository catalog (`.repos/catalog.csv`) maintains metadata about each cloned repository for easy discovery and organization. This is separate from the usage log and serves as an index of available examples.

### Catalog Fields

- **dir**: Repository directory name
- **repoUrl**: Full Git URL for cloning
- **commitSha**: Git commit SHA when cloned (optional)
- **version**: Version/tag if applicable (optional)
- **dateAdded**: UTC timestamp when added to catalog
- **languages**: Array of programming languages used (e.g., `['TypeScript', 'JavaScript']`)
- **libraryType**: Type of repository:
  - `component-library`: UI component libraries
  - `framework`: Frameworks or meta-frameworks
  - `utility`: Utility libraries or tools
  - `full-project`: Complete applications
  - `example`: Example implementations
  - `boilerplate`: Starter templates
  - `other`: Other types
- **isFullProject**: Boolean indicating if it's a complete application vs library/component
- **license**: License type (e.g., `MIT`, `Apache-2.0`) (optional)
- **creator**: Author/creator name or GitHub username (optional)
- **description**: Brief description of what the repo demonstrates (optional)
- **tags**: Additional tags for categorization (e.g., `['react', 'tailwind', 'ui-components']`) (optional)

### Using the Catalog Programmatically

```typescript
import { catalogRepo, readRepoCatalog, findReposByCriteria } from './repo-catalog'

// Catalog a newly cloned repository
catalogRepo({
  dir: 'shadcn-ui',
  repoUrl: 'https://github.com/shadcn-ui/ui.git',
  commitSha: 'abc123...',
  languages: ['TypeScript', 'TSX'],
  libraryType: 'component-library',
  isFullProject: false,
  license: 'MIT',
  creator: 'shadcn',
  description: 'Re-usable components built with Radix UI and Tailwind CSS',
  tags: ['react', 'tailwind', 'radix-ui', 'components'],
})

// Read all catalog entries
const allRepos = readRepoCatalog()

// Find repositories by criteria
const reactRepos = findReposByCriteria({
  languages: ['TypeScript'],
  libraryType: 'component-library',
  tags: ['react'],
})
```

## Usage Logging

The usage log (`.repos/usage-log.csv`) tracks each time a repository is referenced, providing a history of what was useful for specific features. This helps identify patterns and successful reference implementations.

### Usage Log Fields

- **timestamp**: UTC timestamp of when the repo was accessed
- **dir**: The repository directory name
- **action**: What action was taken (`clone`, `read`, `copy`, `reference`, `search`)
- **description**: Explanation of why the repo was used
- **repoUrl**: Git URL for re-cloning (optional)
- **filePath**: Specific file referenced (optional)
- **context**: What feature/task was being worked on (optional)

The log file is git-ignored and can be used to track which repos were helpful for specific features, making it easier to reference successful patterns later.

### Using the Usage Log Programmatically

```typescript
import { logRepoUsage } from './repo-log'

// Example: When cloning a new repo
logRepoUsage({
  dir: 'shadcn-ui',
  action: 'clone',
  description: 'Cloned to reference button component implementation',
  repoUrl: 'https://github.com/shadcn-ui/ui.git',
  context: 'Building custom button component',
})

// Example: When reading/referencing a file
logRepoUsage({
  dir: 'shadcn-ui',
  action: 'read',
  description: 'Referenced button.tsx for styling patterns',
  repoUrl: 'https://github.com/shadcn-ui/ui.git',
  filePath: 'components/ui/button.tsx',
  context: 'Implementing button variants',
})

// Example: When copying code patterns
logRepoUsage({
  dir: 'example-crud-app',
  action: 'copy',
  description: 'Copied data table pagination logic',
  repoUrl: 'https://github.com/example/crud-app.git',
  filePath: 'app/components/DataTable.tsx',
  context: 'Adding pagination to dashboard table',
})

// Example: When referencing a repo for patterns/architecture
logRepoUsage({
  dir: 'example-repo',
  action: 'reference',
  description: 'Used for implementing data table patterns',
  repoUrl: 'https://github.com/example/repo.git',
  filePath: 'src/components/Table.tsx',
  context: 'Building dashboard data table',
})
```

### Available Actions

- `clone`: Repository was cloned
- `read`: Repository or file was read/referenced
- `copy`: Code was copied or adapted
- `reference`: Repository was referenced for patterns/architecture
- `search`: Repository was searched for specific patterns

## Example: Hello World

Here's a simple example file to demonstrate the structure:

```javascript
// hello-world.js
console.log('Hello, World!');
```

## Notes

- This directory (`.repos`) is git-ignored, so cloned repositories won't be committed to your project
- The usage log (`.repos/usage-log.csv`) is git-ignored
- The catalog (`.repos/catalog.csv`) is git-ignored
- Use `.repos.example` as a template (this directory is checked into git)
- The setup script will copy `.repos.example` to `.repos` if it doesn't exist

## Creating Cursor Rules

To adopt these policies in Cursor, you can:

1. **Add to `.cursorrules`**: Copy relevant sections of this README into your `.cursorrules` file
2. **Create a rule file**: Add a new file in `.cursor/rules/` (e.g., `repo-examples.mdc`) with the policies
3. **Reference this file**: Simply reference this README in your cursor rules

Example cursor rule content:

```text
When implementing features, always:
1. Check .repos/catalog.csv for existing examples
2. Suggest searching the web for relevant repositories if no examples exist
3. Catalog any newly cloned repositories
4. Log usage whenever referencing code from .repos/
```
