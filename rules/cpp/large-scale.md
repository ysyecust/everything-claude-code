---
paths:
  - "**/CMakeLists.txt"
  - "**/CMakePresets.json"
  - "**/vcpkg.json"
  - "**/conanfile.*"
  - "**/*.cmake"
  - "**/.clang-tidy"
  - "**/.clangd"
---
# C++ Large-Scale Build & Dependency Rules

> This file extends [common/patterns.md](../common/patterns.md) with large-scale C++ project rules.

## Build System

- Use **CMake Presets** (`CMakePresets.json`) for all build configurations
- Always set `CMAKE_EXPORT_COMPILE_COMMANDS ON`
- Use **ccache** or **sccache** via `CMAKE_CXX_COMPILER_LAUNCHER`
- Use **mold** or **lld** linker for faster link times
- Enable **LTO** in release presets: `CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE ON`

## Dependency Management

- Use **vcpkg manifest mode** (`vcpkg.json`) or **Conan 2.x** for external deps
- Use `FetchContent` only for lightweight, header-only libs
- Pin dependency versions — no floating versions in production
- Separate build deps (gtest, benchmark) from runtime deps

## Physical Design

- **One class per header/source pair** — enables incremental builds
- **Forward declare** in headers, `#include` in sources
- **No circular dependencies** between CMake library targets
- **Layered architecture** — lower layers never depend on upper layers
- Use **PIMPL** for frequently-included headers with heavy deps

## Compile-Time Hygiene

- Use **precompiled headers** for heavy third-party headers (Eigen, Boost, fmt)
- Keep headers lightweight — minimize `#include` chains
- Use `#pragma once` for include guards
- Run **include-what-you-use** periodically to trim unused includes

## Static Analysis (CI Required)

- **clang-format** — formatting consistency, no debates
- **clang-tidy** — bugprone, performance, modernize checks
- **cppcheck** — additional portability and style warnings
- Configure via `.clang-tidy` and project-level `.cppcheck-suppress`

## Reference

See skill: `cpp-large-scale` for detailed patterns, configurations, and CI templates.
