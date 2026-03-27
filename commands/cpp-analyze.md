---
description: Run full C++ static analysis pipeline — clang-tidy, cppcheck, include-what-you-use, and build diagnostics. Generates actionable report grouped by severity.
---

# C++ Static Analysis

Run a comprehensive static analysis pipeline for C++ projects.

## What This Command Does

1. **Verify build** — ensure compile_commands.json exists
2. **clang-format** — check formatting compliance
3. **clang-tidy** — modernize, bugprone, performance checks
4. **cppcheck** — additional warnings, portability, performance
5. **Build with warnings** — `-Wall -Wextra -Wpedantic`
6. **Generate report** — grouped by severity with fix suggestions

## When to Use

Use `/cpp-analyze` when:
- Before submitting code for review
- After large refactoring sessions
- Setting up CI/CD analysis pipeline
- Investigating potential undefined behavior or memory issues
- Auditing code quality in a new codebase

## Analysis Steps

### Step 1: Check Prerequisites

```bash
# Verify compile_commands.json exists
ls build/*/compile_commands.json 2>/dev/null || \
  ls compile_commands.json 2>/dev/null || \
  echo "WARNING: No compile_commands.json found. Run cmake with -DCMAKE_EXPORT_COMPILE_COMMANDS=ON"
```

### Step 2: clang-format Check

```bash
find src include -name '*.cpp' -o -name '*.hpp' | \
  xargs clang-format --dry-run -Werror 2>&1 | head -50
```

### Step 3: clang-tidy

```bash
# Use compile_commands.json for accurate analysis
run-clang-tidy -p build/debug -j$(nproc) \
  -checks='bugprone-*,performance-*,modernize-*,cppcoreguidelines-*' \
  'src/.*\.(cpp|hpp)$' 2>&1 | head -200
```

### Step 4: cppcheck

```bash
cppcheck --project=build/debug/compile_commands.json \
  --enable=warning,performance,portability,style \
  --inline-suppr \
  --error-exitcode=0 \
  -j$(nproc) 2>&1 | head -100
```

### Step 5: Build with Strict Warnings

```bash
cmake --build build/debug -- -j$(nproc) 2>&1 | \
  grep -E "(warning:|error:)" | sort -u | head -50
```

## Report Format

```text
C++ STATIC ANALYSIS REPORT
===========================
Date: <date>
Project: <project name>
Files analyzed: <count>

CRITICAL (must fix)
-------------------
[bugprone-use-after-move] src/solver.cpp:42
  - Variable 'result' used after std::move
  - Fix: Remove use-after-move or copy instead

[cppcoreguidelines-owning-memory] src/mesh.cpp:87
  - Raw new without owning pointer
  - Fix: Use std::make_unique<Mesh>(...)

WARNING (should fix)
--------------------
[performance-unnecessary-copy-initialization] src/io.cpp:15
  - Unnecessary copy of 'config' (2.4KB type)
  - Fix: Use const reference

[modernize-use-nullptr] src/legacy.cpp:33
  - NULL used instead of nullptr
  - Fix: Replace NULL with nullptr

STYLE (consider)
----------------
[readability-identifier-naming] src/utils.hpp:12
  - Variable 'MyVar' doesn't match lower_case convention

FORMAT
------
Files with formatting violations: <count>

SUMMARY
-------
| Category | Count |
|----------|-------|
| Critical | N     |
| Warning  | N     |
| Style    | N     |
| Format   | N     |
| Total    | N     |
```

## Related Commands

- `/cpp-build` — fix build errors found by analysis
- `/cpp-review` — full code review with memory safety focus
- `/cpp-test` — run tests after fixing analysis findings

## Related

- Skill: `cpp-large-scale` — static analysis pipeline configuration
- Skill: `cpp-coding-standards` — coding standards that clang-tidy enforces
- Agent: `cpp-reviewer` — manual code review with deeper context
