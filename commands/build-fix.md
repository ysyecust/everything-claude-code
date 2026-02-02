---
description: Incrementally fix C++20/CMake build errors. Parses compiler output, diagnoses root cause, and applies minimal surgical fixes one at a time.
---

# Build Fix

Incrementally fix C++20/CMake build errors:

1. Run build: `cmake --build build 2>&1 | head -50`

2. Parse error output:
   - Group by file
   - Categorize: CMake config, linker, template, concept, include, C++20 feature
   - Sort by severity (first error causes cascade)

3. For each error (starting from FIRST):
   - Show error context (5 lines before/after in source)
   - Identify error category
   - Explain the issue (template constraints, missing symbols, etc.)
   - Propose fix
   - Apply fix
   - Re-run build: `cmake --build build 2>&1 | head -50`
   - Verify error resolved

4. Stop if:
   - Fix introduces new errors (revert and try alternative)
   - Same error persists after 3 attempts
   - User requests pause

5. If CMake cache is stale:
   - `rm -rf build && cmake -B build -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON`

6. Show summary:
   - Errors fixed (with categories)
   - Errors remaining
   - New errors introduced (if any)

Fix one error at a time for safety!

## Common C++20/CMake Error Patterns

- **Missing #include**: `'span' is not a member of 'std'` -> add `#include <span>`
- **Linker errors**: `undefined reference` -> check target_link_libraries
- **Concept failures**: `constraints not satisfied` -> verify type requirements
- **Template errors**: read innermost `note:` for actual cause
- **CMake find_package**: install dev package or use FetchContent
