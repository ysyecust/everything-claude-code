---
name: instinct-export
description: Export instincts for sharing with teammates or other projects
command: /instinct-export
---

# Instinct Export Command

Exports instincts to a shareable format. Perfect for:
- Sharing with teammates
- Transferring to a new machine
- Contributing to project conventions

## Usage

```
/instinct-export                           # Export all personal instincts
/instinct-export --domain testing          # Export only testing instincts
/instinct-export --min-confidence 0.7      # Only export high-confidence instincts
/instinct-export --output team-instincts.yaml
```

## What to Do

1. Read instincts from `~/.claude/homunculus/instincts/personal/`
2. Filter based on flags
3. Strip sensitive information:
   - Remove session IDs
   - Remove file paths (keep only patterns)
   - Remove timestamps older than "last week"
4. Generate export file

## Privacy Considerations

Exports include:
- Trigger patterns
- Actions
- Confidence scores
- Domains
- Observation counts

Exports do NOT include:
- Actual code snippets
- File paths
- Session transcripts
- Personal identifiers

## Flags

- `--domain <name>`: Export only specified domain
- `--min-confidence <n>`: Minimum confidence threshold (default: 0.3)
- `--output <file>`: Output file path (default: instincts-export-YYYYMMDD.yaml)
- `--format <yaml|json|md>`: Output format (default: yaml)
- `--include-evidence`: Include evidence text (default: excluded)
