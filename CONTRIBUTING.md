# Contributing to Everything Claude Code

Thanks for wanting to contribute. This repo is meant to be a community resource for Claude Code users, focused on C++20 HPC development.

## What We're Looking For

### Agents

New agents that handle specific tasks well:
- HPC specialists (GPU offload, MPI debugging, profiling)
- Build system experts (Ninja, Meson, Bazel)
- Domain experts (CFD, FEM, molecular dynamics)
- Language reviewers (Python bindings, Fortran interop)

### Skills

Workflow definitions and domain knowledge:
- C++20/23 best practices
- HPC framework patterns (MPI, OpenMP, SYCL)
- Testing strategies (Google Test, Catch2)
- Architecture guides
- Domain-specific knowledge

### Commands

Slash commands that invoke useful workflows:
- Profiling commands (perf, vtune)
- Testing commands
- Documentation commands
- Code generation commands

### Hooks

Useful automations:
- clang-format / clang-tidy hooks
- Security checks (sanitizer enforcement)
- Validation hooks
- Notification hooks

### Rules

Always-follow guidelines:
- Security rules
- C++20 code style rules
- Testing requirements
- Naming conventions

### MCP Configurations

New or improved MCP server configs:
- Database integrations
- Cloud provider MCPs
- Monitoring tools
- Communication tools

---

## How to Contribute

### 1. Fork the repo

```bash
git clone https://github.com/YOUR_USERNAME/everything-claude-code.git
cd everything-claude-code
```

### 2. Create a branch

```bash
git checkout -b add-gpu-offload-agent
```

### 3. Add your contribution

Place files in the appropriate directory:
- `agents/` for new agents
- `skills/` for skills (can be single .md or directory)
- `commands/` for slash commands
- `rules/` for rule files
- `hooks/` for hook configurations
- `mcp-configs/` for MCP server configs

### 4. Follow the format

**Agents** should have frontmatter:

```markdown
---
name: agent-name
description: What it does
tools: Read, Grep, Glob, Bash
model: sonnet
---

Instructions here...
```

**Skills** should be clear and actionable:

```markdown
# Skill Name

## When to Use

...

## How It Works

...

## Examples

...
```

**Commands** should explain what they do:

```markdown
---
description: Brief description of command
---

# Command Name

Detailed instructions...
```

**Hooks** should include descriptions:

```json
{
  "matcher": "...",
  "hooks": [...],
  "description": "What this hook does"
}
```

### 5. Test your contribution

```bash
# Run the test suite
node tests/run-all.js

# Run CI validation scripts
node scripts/ci/validate-agents.js
node scripts/ci/validate-commands.js
node scripts/ci/validate-hooks.js
node scripts/ci/validate-rules.js
node scripts/ci/validate-skills.js

# If you have a CMake project, also verify builds
cmake -B build && cmake --build build && ctest --test-dir build
```

### 6. Submit a PR

```bash
git add .
git commit -m "feat: add GPU offload agent"
git push origin add-gpu-offload-agent
```

Then open a PR with:
- What you added
- Why it's useful
- How you tested it

---

## Guidelines

### Do

- Keep configs focused and modular
- Include clear descriptions
- Test before submitting
- Follow existing patterns
- Document any dependencies

### Don't

- Include sensitive data (API keys, tokens, paths)
- Add overly complex or niche configs
- Submit untested configs
- Create duplicate functionality
- Add configs that require specific paid services without alternatives

---

## File Naming

- Use lowercase with hyphens: `gpu-offload-reviewer.md`
- Be descriptive: `tdd-workflow.md` not `workflow.md`
- Match the agent/skill name to the filename

---

## Questions?

Open an issue on GitHub.

---

Thanks for contributing. Let's build a great resource together.
