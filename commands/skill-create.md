---
name: skill-create
description: Analyze local git history to extract coding patterns and generate SKILL.md files. Local version of the Skill Creator GitHub App.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /skill-create - Local Skill Generation

Analyze your repository's git history to extract coding patterns and generate SKILL.md files that teach Claude your team's practices.

## Usage

```bash
/skill-create                    # Analyze current repo
/skill-create --commits 100      # Analyze last 100 commits
/skill-create --output ./skills  # Custom output directory
/skill-create --instincts        # Also generate instincts for continuous-learning-v2
```

## What It Does

1. **Parses Git History** - Analyzes commits, file changes, and patterns
2. **Detects Patterns** - Identifies recurring workflows and conventions
3. **Generates SKILL.md** - Creates valid Claude Code skill files
4. **Optionally Creates Instincts** - For the continuous-learning-v2 system

## Analysis Steps

### Step 1: Gather Git Data

```bash
# Get recent commits with file changes
git log --oneline -n ${COMMITS:-200} --name-only --pretty=format:"%H|%s|%ad" --date=short

# Get commit frequency by file
git log --oneline -n 200 --name-only | grep -v "^$" | grep -v "^[a-f0-9]" | sort | uniq -c | sort -rn | head -20

# Get commit message patterns
git log --oneline -n 200 | cut -d' ' -f2- | head -50
```

### Step 2: Detect Patterns

| Pattern | Detection Method |
|---------|-----------------|
| **Commit conventions** | Regex on commit messages (feat:, fix:, chore:) |
| **File co-changes** | Files that always change together |
| **Workflow sequences** | Repeated file change patterns |
| **Architecture** | Folder structure and naming conventions |
| **Testing patterns** | Test file locations, naming, coverage |

### Step 3: Generate SKILL.md

Output format:

```markdown
---
name: {repo-name}-patterns
description: Coding patterns extracted from {repo-name}
version: 1.0.0
source: local-git-analysis
analyzed_commits: {count}
---

# {Repo Name} Patterns

## Commit Conventions
{detected commit message patterns}

## Code Architecture
{detected folder structure and organization}

## Workflows
{detected repeating file change patterns}

## Testing Patterns
{detected test conventions}
```

## Related Commands

- `/instinct-import` - Import generated instincts
- `/instinct-status` - View learned instincts
- `/evolve` - Cluster instincts into skills/agents
