# PNPM Setup Guide - Fixing Installation Issues

## Problem Summary
You had **three conflicting PNPM installations**:
1. ✅ Homebrew PNPM (removed) - conflicted with Corepack
2. ✅ Global NPM PNPM (removed) - created duplicate installations
3. ⚠️  Corepack (needs enabling) - the modern, recommended approach

## ✅ What's Been Fixed
- ✅ Removed duplicate global npm PNPM installation
- ✅ Removed Homebrew PNPM (conflicts with Corepack)
- ✅ Added `packageManager` field to package.json
- ✅ Added Node.js engine constraints

## 🔧 Final Step Required (You Must Run This)

Run this command **once** in your terminal (it will ask for your password):

```bash
sudo corepack enable
```

This enables Corepack system-wide and creates the necessary symlinks for PNPM.

## 🎯 Why This Solution Works

### Corepack is the Modern Standard
- **Built into Node.js** - No separate installation needed
- **Project-specific versions** - Each project uses its declared `packageManager` version
- **Zero global installs** - Automatically downloads the right version per project
- **Official recommendation** - Endorsed by Node.js, npm, and pnpm teams

### How It Works
1. Your `package.json` now declares: `"packageManager": "pnpm@10.22.0"`
2. When you run `pnpm` in this project, Corepack sees the declaration
3. Corepack automatically ensures v10.22.0 is available
4. No more version conflicts or "pnpm not found" errors

## 🚀 After Enabling Corepack

### Verify Installation
```bash
# Check PNPM is available
pnpm --version
# Should show: 10.22.0

# Check location
which pnpm
# Should show: /usr/local/bin/pnpm (managed by Corepack)
```

### Install Project Dependencies
```bash
cd "/Users/TH33_ORACL3/AZ Labs/1 - Development/youtube-downloader"
pnpm install
```

### Optional: Pin a Specific Version System-Wide
If you want a default PNPM version for projects without `packageManager`:
```bash
corepack prepare pnpm@10.22.0 --activate
```

## 🔄 How to Use PNPM Going Forward

### In This Project
Just use `pnpm` commands as normal:
```bash
pnpm install           # Install dependencies
pnpm run dev          # Run development server
pnpm add <package>    # Add a package
pnpm remove <package> # Remove a package
```

### In New Projects
Always add to `package.json`:
```json
{
  "packageManager": "pnpm@10.22.0",
  "engines": {
    "node": ">=20 <26"
  }
}
```

### Updating PNPM
To update to a new version:
```bash
# 1. Check latest version
corepack prepare pnpm@latest --activate

# 2. Update package.json
# Change "packageManager": "pnpm@X.Y.Z" to new version

# 3. Done! Corepack handles the rest
```

## 🐛 Troubleshooting

### "pnpm: command not found"
```bash
# Enable Corepack (needs sudo)
sudo corepack enable

# Or use this in the project:
corepack enable pnpm
```

### Wrong PNPM Version
```bash
# Clear Corepack cache
rm -rf ~/.cache/node/corepack

# Re-run in project
pnpm --version  # Corepack will re-download the correct version
```

### Permission Errors
```bash
# If you see EACCES errors:
sudo corepack enable

# Alternative (no sudo):
# Add to ~/.zshrc:
export COREPACK_HOME="$HOME/.corepack"
```

## 📋 Your Shell Configuration

Your `~/.zshrc` has these PNPM settings (can be removed now):
```bash
# pnpm - NO LONGER NEEDED with Corepack
export PNPM_HOME="/Users/TH33_ORACL3/Library/pnpm"
export PATH="$PNPM_HOME:$PATH"
```

You can remove these lines since Corepack manages PNPM automatically.

## ✅ Verification Checklist

After running `sudo corepack enable`:
- [ ] `pnpm --version` returns `10.22.0`
- [ ] `which pnpm` shows `/usr/local/bin/pnpm` or `/opt/homebrew/bin/pnpm`
- [ ] `pnpm install` works in this project
- [ ] No "command not found" errors

## 🎓 Learn More
- [Corepack Documentation](https://nodejs.org/api/corepack.html)
- [PNPM Installation Guide](https://pnpm.io/installation)
- [Why Corepack?](https://nodejs.org/dist/latest/docs/api/corepack.html#corepack)


