---
name: instinct-status
description: Show all learned instincts with their confidence levels
command: true
---

# Instinct Status Command

Shows all learned instincts with their confidence scores, grouped by domain.

## Implementation

Run the instinct CLI using the plugin root path:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" status
```

Or if `CLAUDE_PLUGIN_ROOT` is not set (manual installation), use:

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py status
```

## Usage

```
/instinct-status
/instinct-status --domain code-style
/instinct-status --low-confidence
```

## What to Do

1. Read all instinct files from `~/.claude/homunculus/instincts/personal/`
2. Read inherited instincts from `~/.claude/homunculus/instincts/inherited/`
3. Display them grouped by domain with confidence bars

## Flags

- `--domain <name>`: Filter by domain (code-style, testing, git, etc.)
- `--low-confidence`: Show only instincts with confidence < 0.5
- `--high-confidence`: Show only instincts with confidence >= 0.7
- `--source <type>`: Filter by source (session-observation, repo-analysis, inherited)
- `--json`: Output as JSON for programmatic use
