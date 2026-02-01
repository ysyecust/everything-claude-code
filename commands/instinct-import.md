---
name: instinct-import
description: Import instincts from teammates, Skill Creator, or other sources
command: true
---

# Instinct Import Command

## Implementation

Run the instinct CLI using the plugin root path:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" import <file-or-url> [--dry-run] [--force] [--min-confidence 0.7]
```

Or if `CLAUDE_PLUGIN_ROOT` is not set (manual installation):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py import <file-or-url>
```

Import instincts from:
- Teammates' exports
- Skill Creator (repo analysis)
- Community collections
- Previous machine backups

## Usage

```
/instinct-import team-instincts.yaml
/instinct-import https://github.com/org/repo/instincts.yaml
/instinct-import --from-skill-creator acme/webapp
```

## What to Do

1. Fetch the instinct file (local path or URL)
2. Parse and validate the format
3. Check for duplicates with existing instincts
4. Merge or add new instincts
5. Save to `~/.claude/homunculus/instincts/inherited/`

## Merge Strategies

### For Duplicates
- **Higher confidence wins**: Keep the one with higher confidence
- **Merge evidence**: Combine observation counts
- **Update timestamp**: Mark as recently validated

### For Conflicts
- **Skip by default**: Don't import conflicting instincts
- **Flag for review**: Mark both as needing attention
- **Manual resolution**: User decides which to keep

## Flags

- `--dry-run`: Preview without importing
- `--force`: Import even if conflicts exist
- `--merge-strategy <higher|local|import>`: How to handle duplicates
- `--from-skill-creator <owner/repo>`: Import from Skill Creator analysis
- `--min-confidence <n>`: Only import instincts above threshold
