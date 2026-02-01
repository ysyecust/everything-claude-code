# The Shorthand Guide to Everything Claude Code

---

**This is a complete setup guide for Claude Code configurations, adapted for C++20 HPC development.**

Here's the complete setup: skills, hooks, subagents, MCPs, plugins, and what actually works.

---

## Skills and Commands

Skills operate like rules, constricted to certain scopes and workflows. They're shorthand to prompts when you need to execute a particular workflow.

After a long session of coding with Opus 4.5, you want to clean out dead code and loose .md files? Run `/refactor-clean`. Need testing? `/tdd`, `/integration-test`, `/test-coverage`. Skills can also include codemaps - a way for Claude to quickly navigate your codebase without burning context on exploration.

Commands are skills executed via slash commands. They overlap but are stored differently:

- **Skills**: `~/.claude/skills/` - broader workflow definitions
- **Commands**: `~/.claude/commands/` - quick executable prompts

```bash
# Example skill structure
~/.claude/skills/
  coding-standards/       # C++20 naming, concepts, ranges
  hpc-patterns/           # Cache-friendly, SIMD, threading, NUMA
  numerical-patterns/     # Sparse matrices, solvers, I/O
  tdd-workflow/           # Google Test/Mock TDD methodology
  security-review/        # Security checklist and sanitizers
```

---

## Hooks

Hooks are trigger-based automations that fire on specific events. Unlike skills, they're constricted to tool calls and lifecycle events.

**Hook Types:**

1. **PreToolUse** - Before a tool executes (validation, reminders)
2. **PostToolUse** - After a tool finishes (formatting, feedback loops)
3. **UserPromptSubmit** - When you send a message
4. **Stop** - When Claude finishes responding
5. **PreCompact** - Before context compaction
6. **Notification** - Permission requests

**Example: clang-format after editing C++ files**

```json
{
  "PostToolUse": [
    {
      "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(cpp|hpp|cc|h)$\"",
      "hooks": [
        {
          "type": "command",
          "command": "clang-format --style=Google -i \"$file_path\""
        }
      ]
    }
  ]
}
```

**Pro tip:** Use the `hookify` plugin to create hooks conversationally instead of writing JSON manually. Run `/hookify` and describe what you want.

---

## Subagents

Subagents are processes your orchestrator (main Claude) can delegate tasks to with limited scopes. They can run in background or foreground, freeing up context for the main agent.

```bash
# Example subagent structure
~/.claude/agents/
  planner.md               # Feature implementation planning
  architect.md             # System design decisions
  tdd-guide.md             # C++20 test-driven development
  code-reviewer.md         # Memory safety and performance review
  security-reviewer.md     # Sanitizer and vulnerability analysis
  build-error-resolver.md  # CMake/linker/template error resolution
  integration-test-runner.md  # CTest integration testing
  refactor-cleaner.md      # Dead code cleanup
  doc-updater.md           # Documentation sync
```

Configure allowed tools, MCPs, and permissions per subagent for proper scoping.

---

## Rules and Memory

Your `.rules` folder holds `.md` files with best practices Claude should ALWAYS follow. Two approaches:

1. **Single CLAUDE.md** - Everything in one file (user or project level)
2. **Rules folder** - Modular `.md` files grouped by concern

```bash
~/.claude/rules/
  security.md      # Buffer overflow, use-after-free, sanitizers, CWE Top 25
  coding-style.md  # RAII, const correctness, C++20 features
  testing.md       # Google Test, 80% coverage, TDD workflow
  git-workflow.md  # Conventional commits, PR process
  agents.md        # When to delegate to subagents
  performance.md   # Model selection, context management
  patterns.md      # Result type, CRTP, Builder pattern
  hooks.md         # Hook usage guidelines
```

**Example rules:**

- No debug output (std::cout, printf) in committed code
- Always use RAII for resource management
- Run sanitizers (ASan/UBSan/TSan) before committing
- Prefer constexpr over runtime computation
- Never commit code that doesn't compile with -Wall -Werror

---

## MCPs (Model Context Protocol)

MCPs connect Claude to external services directly. Not a replacement for APIs - it's a prompt-driven wrapper around them, allowing more flexibility in navigating information.

**CRITICAL: Context Window Management**

Be picky with MCPs. Keep all MCPs in user config but **disable everything unused**.

Your 200k context window before compacting might only be 70k with too many tools enabled. Performance degrades significantly.

**Rule of thumb:** Have 20-30 MCPs configured, but keep under 10 enabled / under 80 tools active.

---

## Plugins

Plugins package tools for easy installation instead of tedious manual setup. A plugin can be a skill + MCP combined, or hooks/tools bundled together.

**Installing plugins:**

```bash
# Add a marketplace
claude plugin marketplace add https://github.com/mixedbread-ai/mgrep

# Open Claude, run /plugins, find new marketplace, install from there
```

Same warning as MCPs - watch your context window.

---

## Tips and Tricks

### Keyboard Shortcuts

- `Ctrl+U` - Delete entire line (faster than backspace spam)
- `!` - Quick bash command prefix
- `@` - Search for files
- `/` - Initiate slash commands
- `Shift+Enter` - Multi-line input
- `Tab` - Toggle thinking display
- `Esc Esc` - Interrupt Claude / restore code

### Parallel Workflows

- **Fork** (`/fork`) - Fork conversations to do non-overlapping tasks in parallel
- **Git Worktrees** - For overlapping parallel Claudes without conflicts

```bash
git worktree add ../feature-branch feature-branch
# Now run separate Claude instances in each worktree
```

### tmux for Long-Running Commands

Stream and watch logs/bash processes Claude runs:

```bash
tmux new -s dev
# Claude runs commands here, you can detach and reattach
tmux attach -t dev
```

### Other Useful Commands

- `/rewind` - Go back to a previous state
- `/statusline` - Customize with branch, context %, todos
- `/checkpoints` - File-level undo points
- `/compact` - Manually trigger context compaction

---

## Key Takeaways

1. **Don't overcomplicate** - treat configuration like fine-tuning, not architecture
2. **Context window is precious** - disable unused MCPs and plugins
3. **Parallel execution** - fork conversations, use git worktrees
4. **Automate the repetitive** - hooks for formatting, linting, reminders
5. **Scope your subagents** - limited tools = focused execution

---

## References

- [Plugins Reference](https://code.claude.com/docs/en/plugins-reference)
- [Hooks Documentation](https://code.claude.com/docs/en/hooks)
- [Subagents](https://code.claude.com/docs/en/sub-agents)
- [MCP Overview](https://code.claude.com/docs/en/mcp-overview)

---

**Note:** This is a subset of detail. See the [Longform Guide](./the-longform-guide.md) for advanced patterns.

---

*Adapted for C++20 HPC from the [original guide](https://github.com/affaan-m/everything-claude-code)*
