# The Longform Guide to Everything Claude Code

---

> **Prerequisite**: This guide builds on [The Shorthand Guide to Everything Claude Code](./the-shortform-guide.md). Read that first if you haven't set up skills, hooks, subagents, MCPs, and plugins.

The shorthand guide covered the foundational setup: skills and commands, hooks, subagents, MCPs, plugins, and the configuration patterns that form the backbone of an effective Claude Code workflow.

This longform guide goes into the techniques that separate productive sessions from wasteful ones. The themes: token economics, memory persistence, verification patterns, parallelization strategies, and the compound effects of building reusable workflows.

Everything covered in both guides is available on GitHub: `github.com/affaan-m/everything-claude-code`

---

## Tips and Tricks

### Some MCPs are Replaceable and Will Free Up Your Context Window

For MCPs such as version control (GitHub), databases, deployment etc. - most of these platforms already have robust CLIs that the MCP is essentially just wrapping.

To have the CLI function more like an MCP without actually using the MCP (and the decreased context window that comes with it), consider bundling the functionality into skills and commands.

Example: instead of having the GitHub MCP loaded at all times, create a `/gh-pr` command that wraps `gh pr create` with your preferred options.

With lazy loading, the context window issue is mostly solved. But token usage and cost is not solved in the same way. The CLI + skills approach is still a token optimization method.

---

## IMPORTANT STUFF

### Context and Memory Management

For sharing memory across sessions, a skill or command that summarizes and checks in on progress then saves to a `.tmp` file in your `.claude` folder and appends to it until the end of your session is the best bet.

Claude creates a file summarizing current state. Review it, ask for edits if needed, then start fresh. These files should contain:
- What approaches worked (verifiably with evidence)
- Which approaches were attempted but did not work
- Which approaches have not been attempted and what's left to do

**Clearing Context Strategically:**

Once you have your plan set and context cleared, you can work from the plan. For strategic compacting, disable auto compact. Manually compact at logical intervals or create a skill that does so for you.

**Advanced: Dynamic System Prompt Injection**

```bash
claude --system-prompt "$(cat memory.md)"
```

**Practical setup:**

```bash
# Daily development
alias claude-dev='claude --system-prompt "$(cat ~/.claude/contexts/dev.md)"'

# PR review mode
alias claude-review='claude --system-prompt "$(cat ~/.claude/contexts/review.md)"'

# Research/exploration mode
alias claude-research='claude --system-prompt "$(cat ~/.claude/contexts/research.md)"'
```

**Advanced: Memory Persistence Hooks**

- **PreCompact Hook**: Before context compaction happens, save important state to a file
- **Stop Hook (Session End)**: On session end, persist learnings to a file
- **SessionStart Hook**: On new session, load previous context automatically

These hooks are in the repo at `hooks/memory-persistence`

---

### Continuous Learning / Memory

If you've had to repeat a prompt multiple times and Claude ran into the same problem or gave you a response you've heard before - those patterns must be appended to skills.

**The Solution:** When Claude Code discovers something that isn't trivial - a debugging technique, a workaround, some project-specific pattern - it saves that knowledge as a new skill. Next time a similar problem comes up, the skill gets loaded automatically.

The continuous learning skill is at `skills/continuous-learning` and the v2 instinct-based system is at `skills/continuous-learning-v2`.

---

### Token Optimization

**Primary Strategy: Subagent Architecture**

Optimize the tools you use and subagent architecture designed to delegate the cheapest possible model that is sufficient for the task.

**Model Selection Quick Reference:**

| Task Type | Model | Why |
|-----------|-------|-----|
| Exploration/search | Haiku | Fast, cheap, good enough for finding files |
| Simple edits | Haiku | Single-file changes, clear instructions |
| Multi-file implementation | Sonnet | Best balance for coding |
| Complex architecture | Opus | Deep reasoning needed |
| PR reviews | Sonnet | Understands context, catches nuance |
| Security analysis | Opus | Can't afford to miss vulnerabilities |
| Writing docs | Haiku | Structure is simple |
| Debugging complex bugs | Opus | Needs to hold entire system in mind |

Default to Sonnet for 90% of coding tasks. Upgrade to Opus when first attempt failed, task spans 5+ files, architectural decisions, or security-critical code.

**Modular Codebase Benefits:**

Having a more modular codebase with main files being in the hundreds of lines instead of thousands of lines helps both in token optimization costs and getting a task done right on the first try.

---

### Verification Loops and Evals

**Eval Pattern Types:**

- **Checkpoint-Based Evals**: Set explicit checkpoints, verify against defined criteria, fix before proceeding
- **Continuous Evals**: Run every N minutes or after major changes, full test suite + lint

For C++ HPC projects, verification should include:
- `cmake --build build` - compilation check
- `ctest --test-dir build` - test suite
- `clang-tidy` - static analysis
- Sanitizer runs (ASan, UBSan, TSan) for memory/threading safety

---

## PARALLELIZATION

When forking conversations in a multi-Claude terminal setup, make sure the scope is well-defined and aim for minimal overlap when it comes to code changes.

**My Preferred Pattern:**

Main chat for code changes, forks for questions about the codebase and its current state, or research on external services.

**Git Worktrees for Parallel Instances:**

```bash
# Create worktrees for parallel work
git worktree add ../project-feature-a feature-a
git worktree add ../project-feature-b feature-b
git worktree add ../project-refactor refactor-branch

# Each worktree gets its own Claude instance
cd ../project-feature-a && claude
```

IF you are to begin scaling your instances AND you have multiple instances of Claude working on code that overlaps with one another, it's imperative you use git worktrees and have a very well-defined plan for each.

---

## GROUNDWORK

**The Two-Instance Kickoff Pattern:**

For starting a new C++ HPC project with 2 open Claude instances:

**Instance 1: Scaffolding Agent**
- Lays down the scaffold and groundwork
- Creates CMake project structure
- Sets up configs (CLAUDE.md, rules, agents)

**Instance 2: Deep Research Agent**
- Connects to all your services, web search
- Creates the detailed PRD
- Creates architecture mermaid diagrams
- Compiles the references with actual documentation clips

---

## Best Practices for Agents & Sub-Agents

**The Sub-Agent Context Problem:**

Sub-agents exist to save context by returning summaries instead of dumping everything. But the orchestrator has semantic context the sub-agent lacks.

**Iterative Retrieval Pattern:**

1. Orchestrator evaluates every sub-agent return
2. Ask follow-up questions before accepting it
3. Sub-agent goes back to source, gets answers, returns
4. Loop until sufficient (max 3 cycles)

**Key:** Pass objective context, not just the query.

**Orchestrator with Sequential Phases:**

```markdown
Phase 1: RESEARCH (use Explore agent) -> research-summary.md
Phase 2: PLAN (use planner agent) -> plan.md
Phase 3: IMPLEMENT (use tdd-guide agent) -> code changes
Phase 4: REVIEW (use code-reviewer agent) -> review-comments.md
Phase 5: VERIFY (use build-error-resolver if needed) -> done or loop back
```

**Key rules:**

1. Each agent gets ONE clear input and produces ONE clear output
2. Outputs become inputs for next phase
3. Never skip phases
4. Use `/clear` between agents
5. Store intermediate outputs in files

---

## Resources

**Official:**

- Anthropic Academy: anthropic.skilljar.com

---

*Everything covered in both guides is available on GitHub at [everything-claude-code](https://github.com/affaan-m/everything-claude-code)*
*Adapted for C++20 HPC from the [original longform guide](https://github.com/affaan-m/everything-claude-code)*
