---
name: evolve
description: Cluster related instincts into skills, commands, or agents
command: true
---

# Evolve Command

## Implementation

Run the instinct CLI using the plugin root path:

```bash
python3 "${CLAUDE_PLUGIN_ROOT}/skills/continuous-learning-v2/scripts/instinct-cli.py" evolve [--generate]
```

Or if `CLAUDE_PLUGIN_ROOT` is not set (manual installation):

```bash
python3 ~/.claude/skills/continuous-learning-v2/scripts/instinct-cli.py evolve [--generate]
```

Analyzes instincts and clusters related ones into higher-level structures:
- **Commands**: When instincts describe user-invoked actions
- **Skills**: When instincts describe auto-triggered behaviors
- **Agents**: When instincts describe complex, multi-step processes

## Usage

```
/evolve                    # Analyze all instincts and suggest evolutions
/evolve --domain testing   # Only evolve instincts in testing domain
/evolve --dry-run          # Show what would be created without creating
/evolve --threshold 5      # Require 5+ related instincts to cluster
```

## Evolution Rules

### Command (User-Invoked)
When instincts describe actions a user would explicitly request:
- Multiple instincts about "when user asks to..."
- Instincts with triggers like "when creating a new X"
- Instincts that follow a repeatable sequence

### Skill (Auto-Triggered)
When instincts describe behaviors that should happen automatically:
- Pattern-matching triggers
- Error handling responses
- Code style enforcement

### Agent (Needs Depth/Isolation)
When instincts describe complex, multi-step processes that benefit from isolation:
- Debugging workflows
- Refactoring sequences
- Research tasks

## What to Do

1. Read all instincts from `~/.claude/homunculus/instincts/`
2. Group instincts by:
   - Domain similarity
   - Trigger pattern overlap
   - Action sequence relationship
3. For each cluster of 3+ related instincts:
   - Determine evolution type (command/skill/agent)
   - Generate the appropriate file
   - Save to `~/.claude/homunculus/evolved/{commands,skills,agents}/`
4. Link evolved structure back to source instincts

## Flags

- `--execute`: Actually create the evolved structures (default is preview)
- `--dry-run`: Preview without creating
- `--domain <name>`: Only evolve instincts in specified domain
- `--threshold <n>`: Minimum instincts required to form cluster (default: 3)
- `--type <command|skill|agent>`: Only create specified type
