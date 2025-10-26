# Automatic Conflict Resolution

The Epic Stack Updater now includes intelligent automatic conflict resolution for package-related files, eliminating the need to manually resolve merge conflicts in `package.json` and `package-lock.json`.

## How It Works

When applying commits that modify package files, the updater will:

1. **Detect conflicts** in `package.json` and/or `package-lock.json`
2. **Accept incoming changes** for `package.json` (the newer versions from upstream)
3. **Regenerate `package-lock.json`** from the updated `package.json`
4. **Continue the cherry-pick** automatically

## Usage

### Automatic Resolution (Recommended)

```bash
# Apply a commit with automatic conflict resolution
npm run epic-stack-updater -- apply <commit-hash> --auto-resolve
```

### Manual Resolution (Fallback)

If automatic resolution fails or you prefer manual control:

```bash
# Apply a commit without automatic resolution
npm run epic-stack-updater -- apply <commit-hash>
```

When conflicts occur, you'll be prompted with options:

- `continue` - Resolve conflicts manually and continue
- `skip` - Skip this commit
- `abort` - Abort the cherry-pick operation

## Benefits

- **No more manual merge conflicts** in package files
- **Consistent dependency resolution** using npm's lock file generation
- **Faster updates** with less manual intervention
- **Safer updates** by accepting upstream package versions

## When to Use Auto-Resolve

✅ **Recommended for:**

- Dependency updates
- Package version bumps
- Security updates
- Any commit that only affects `package.json` and `package-lock.json`

⚠️ **Use with caution for:**

- Commits that modify both package files AND source code
- Commits with complex dependency changes
- When you have custom package modifications

## Technical Details

The automatic resolution process:

1. Uses `git checkout --theirs package.json` to accept upstream changes
2. Removes the conflicted `package-lock.json`
3. Runs `npm install --package-lock-only` to regenerate the lock file
4. Stages the resolved files and continues the cherry-pick

This approach is safe because:

- `package-lock.json` should always be regenerated from `package.json`
- Upstream package versions are typically more up-to-date
- npm's resolution algorithm ensures consistency
