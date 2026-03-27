---
name: cpp-large-scale
description: Patterns and toolchain guidance for large-scale C++ projects — CMake Presets, dependency management, build acceleration, static analysis pipelines, physical design, and codebase navigation.
origin: fork
---

# Large-Scale C++ Project Patterns

Domain knowledge for managing C++ codebases with 100K+ lines, multiple libraries, and team-scale development.

## When to Activate

- Setting up or restructuring a large C++ project
- Configuring CMake for multi-config, multi-platform builds
- Integrating package managers (vcpkg, Conan)
- Optimizing build times (ccache, precompiled headers, unity builds)
- Setting up static analysis pipelines (clang-tidy, cppcheck, iwyu)
- Designing module boundaries and physical layout

## CMake Presets

Use `CMakePresets.json` for reproducible, shareable build configurations:

```json
{
  "version": 6,
  "cmakeMinimumRequired": { "major": 3, "minor": 25, "patch": 0 },
  "configurePresets": [
    {
      "name": "default",
      "hidden": true,
      "binaryDir": "${sourceDir}/build/${presetName}",
      "cacheVariables": {
        "CMAKE_EXPORT_COMPILE_COMMANDS": "ON",
        "BUILD_TESTING": "ON"
      }
    },
    {
      "name": "debug",
      "inherits": "default",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Debug",
        "CMAKE_CXX_FLAGS": "-g -O0 -fno-omit-frame-pointer"
      }
    },
    {
      "name": "release",
      "inherits": "default",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "Release",
        "CMAKE_CXX_FLAGS": "-O3 -march=native -DNDEBUG"
      }
    },
    {
      "name": "relwithdebinfo",
      "inherits": "default",
      "cacheVariables": {
        "CMAKE_BUILD_TYPE": "RelWithDebInfo",
        "CMAKE_CXX_FLAGS": "-O2 -g -DNDEBUG"
      }
    },
    {
      "name": "sanitize",
      "inherits": "debug",
      "cacheVariables": {
        "CMAKE_CXX_FLAGS": "-g -O1 -fno-omit-frame-pointer -fsanitize=address,undefined -fno-sanitize-recover=all"
      }
    },
    {
      "name": "coverage",
      "inherits": "debug",
      "cacheVariables": {
        "CMAKE_CXX_FLAGS": "-g -O0 --coverage -fprofile-arcs -ftest-coverage"
      }
    }
  ],
  "buildPresets": [
    { "name": "debug", "configurePreset": "debug" },
    { "name": "release", "configurePreset": "release", "jobs": 0 },
    { "name": "sanitize", "configurePreset": "sanitize" }
  ],
  "testPresets": [
    {
      "name": "debug",
      "configurePreset": "debug",
      "output": { "outputOnFailure": true }
    }
  ]
}
```

Usage:

```bash
cmake --preset debug          # Configure
cmake --build --preset debug  # Build
ctest --preset debug          # Test
```

## Build Acceleration

### ccache / sccache

```bash
# Install
sudo apt install ccache  # or: cargo install sccache

# CMake integration (add to preset or CLI)
cmake -DCMAKE_C_COMPILER_LAUNCHER=ccache \
      -DCMAKE_CXX_COMPILER_LAUNCHER=ccache ..

# Verify hit rate
ccache -s
```

### Precompiled Headers (PCH)

```cmake
# CMakeLists.txt — heavy STL/third-party headers
target_precompile_headers(mylib PRIVATE
  <vector>
  <string>
  <unordered_map>
  <memory>
  <algorithm>
  <fmt/format.h>
  <spdlog/spdlog.h>
)

# Reuse PCH across targets
target_precompile_headers(myapp REUSE_FROM mylib)
```

### Unity Builds (Jumbo Compilation)

```cmake
# Merge translation units to reduce redundant header parsing
set(CMAKE_UNITY_BUILD ON)
set(CMAKE_UNITY_BUILD_BATCH_SIZE 16)  # Tune per project
```

### Parallel Linking

```cmake
# Use mold or lld for faster linking
set(CMAKE_EXE_LINKER_FLAGS "-fuse-ld=mold")  # or -fuse-ld=lld
```

### Link-Time Optimization (LTO)

```cmake
# Interprocedural optimization for release builds
set(CMAKE_INTERPROCEDURAL_OPTIMIZATION_RELEASE ON)
```

## compile_commands.json

Essential for IDE integration, clang-tidy, and clangd:

```cmake
set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
```

```bash
# Symlink to project root for IDE/tool discovery
ln -sf build/debug/compile_commands.json compile_commands.json
```

### clangd Configuration (.clangd)

```yaml
CompileFlags:
  CompilationDatabase: build/debug
  Add: [-Wall, -Wextra, -Wpedantic]
  Remove: [-W*]  # Optional: suppress noisy warnings in editor

Diagnostics:
  UnusedIncludes: Strict
  ClangTidy:
    Add: [modernize-*, performance-*, bugprone-*, readability-braces-*]
    Remove: [modernize-use-trailing-return-type]

InlayHints:
  Enabled: true
  ParameterNames: true
  DeducedTypes: true
```

## Dependency Management

### vcpkg (Recommended for large projects)

```json
// vcpkg.json (manifest mode)
{
  "name": "my-project",
  "version-semver": "1.0.0",
  "dependencies": [
    "fmt",
    "spdlog",
    "eigen3",
    { "name": "gtest", "features": ["gmock"] },
    { "name": "benchmark", "features": [] }
  ],
  "builtin-baseline": "2024.01.12"
}
```

```cmake
# CMake toolchain integration
cmake --preset debug -DCMAKE_TOOLCHAIN_FILE=$VCPKG_ROOT/scripts/builtin/vcpkg.cmake
```

### Conan 2.x

```ini
# conanfile.txt
[requires]
fmt/10.2.1
spdlog/1.13.0
gtest/1.14.0

[generators]
CMakeDeps
CMakeToolchain

[layout]
cmake_layout
```

```bash
conan install . --build=missing --profile=default
cmake --preset conan-release
```

### FetchContent (Lightweight deps only)

```cmake
include(FetchContent)

FetchContent_Declare(
  googletest
  GIT_REPOSITORY https://github.com/google/googletest.git
  GIT_TAG        v1.14.0
  GIT_SHALLOW    TRUE
)
FetchContent_MakeAvailable(googletest)
```

## Static Analysis Pipeline

### .clang-tidy

```yaml
Checks: >
  -*,
  bugprone-*,
  cert-*,
  cppcoreguidelines-*,
  misc-*,
  modernize-*,
  performance-*,
  readability-*,
  -modernize-use-trailing-return-type,
  -readability-identifier-length,
  -cppcoreguidelines-avoid-magic-numbers,
  -readability-magic-numbers,
  -misc-non-private-member-variables-in-classes
WarningsAsErrors: >
  bugprone-use-after-move,
  bugprone-dangling-handle,
  cppcoreguidelines-owning-memory,
  performance-unnecessary-copy-initialization
HeaderFilterRegex: 'include/.*\.hpp$'
FormatStyle: file
CheckOptions:
  - key: readability-identifier-naming.ClassCase
    value: CamelCase
  - key: readability-identifier-naming.FunctionCase
    value: CamelCase
  - key: readability-identifier-naming.VariableCase
    value: lower_case
  - key: readability-identifier-naming.PrivateMemberSuffix
    value: '_'
```

### cppcheck Configuration

```bash
# Project-level suppression file: .cppcheck-suppress
unmatchedSuppression:*
missingIncludeSystem
useStlAlgorithm:*/test/*

# Run with project config
cppcheck --project=build/debug/compile_commands.json \
         --suppressions-list=.cppcheck-suppress \
         --enable=warning,performance,portability \
         --inline-suppr \
         --error-exitcode=1 \
         -j$(nproc)
```

### include-what-you-use (IWYU)

```bash
# Run IWYU via CMake
cmake -DCMAKE_CXX_INCLUDE_WHAT_YOU_USE="include-what-you-use;-Xiwyu;--mapping_file=iwyu.imp" ..
cmake --build build 2>&1 | fix_includes.py
```

### Full Analysis Pipeline Script

```bash
#!/bin/bash
set -euo pipefail

BUILD_DIR="build/debug"

echo "=== clang-format check ==="
find src include -name '*.cpp' -o -name '*.hpp' | xargs clang-format --dry-run -Werror

echo "=== clang-tidy ==="
run-clang-tidy -p "$BUILD_DIR" -j$(nproc) 'src/.*\.(cpp|hpp)$'

echo "=== cppcheck ==="
cppcheck --project="$BUILD_DIR/compile_commands.json" \
         --enable=warning,performance,portability \
         --error-exitcode=1 -j$(nproc)

echo "=== build + test ==="
cmake --build "$BUILD_DIR" -j$(nproc)
ctest --test-dir "$BUILD_DIR" --output-on-failure

echo "=== All checks passed ==="
```

## Physical Design for Large Codebases

### Layer Architecture

```
project/
├── include/project/
│   ├── core/              # Layer 0: No internal deps
│   │   ├── types.hpp      #   Fundamental types, concepts
│   │   ├── error.hpp      #   Error types (std::expected)
│   │   └── config.hpp     #   Configuration
│   ├── math/              # Layer 1: Depends on core only
│   │   ├── vector.hpp
│   │   ├── matrix.hpp
│   │   └── solver.hpp
│   ├── domain/            # Layer 2: Depends on core + math
│   │   ├── mesh.hpp
│   │   ├── field.hpp
│   │   └── boundary.hpp
│   └── app/               # Layer 3: Depends on all below
│       ├── simulation.hpp
│       └── io.hpp
├── src/                   # Mirror include structure
│   ├── core/
│   ├── math/
│   ├── domain/
│   └── app/
├── tests/
│   ├── unit/              # Per-module unit tests
│   ├── integration/       # Cross-module tests
│   └── benchmark/         # Performance benchmarks
└── CMakeLists.txt
```

### CMake Library Targets per Layer

```cmake
# Core library (no internal deps)
add_library(project_core
  src/core/types.cpp
  src/core/error.cpp
  src/core/config.cpp
)
target_include_directories(project_core PUBLIC include)
target_compile_features(project_core PUBLIC cxx_std_20)

# Math library (depends on core)
add_library(project_math
  src/math/vector.cpp
  src/math/matrix.cpp
  src/math/solver.cpp
)
target_link_libraries(project_math PUBLIC project_core)

# Domain library (depends on core + math)
add_library(project_domain
  src/domain/mesh.cpp
  src/domain/field.cpp
  src/domain/boundary.cpp
)
target_link_libraries(project_domain PUBLIC project_math)

# Enforce layering: domain must NOT depend on app
# This is enforced by CMake target dependencies
```

### Dependency Rules

1. **No circular dependencies** between libraries
2. **Lower layers never include upper layers** — core/ never includes domain/
3. **One class per header** — enables incremental builds
4. **Forward declare** in headers, `#include` in sources
5. **PIMPL** for stable ABI and fast recompilation

```cpp
// header: fast to compile, stable ABI
class Simulation {
public:
  Simulation();
  ~Simulation();
  void Run();
private:
  struct Impl;
  std::unique_ptr<Impl> impl_;
};

// source: heavy includes isolated here
struct Simulation::Impl {
  Mesh mesh_;
  Solver solver_;
  FieldSet fields_;
  // ...
};
```

## Performance Profiling

### perf + Flamegraph

```bash
# Record CPU profile
perf record -g --call-graph dwarf ./build/release/my_app

# Generate flamegraph
perf script | stackcollapse-perf.pl | flamegraph.pl > flamegraph.svg
```

### Memory Profiling

```bash
# Valgrind heap profiler
valgrind --tool=massif ./build/debug/my_app
ms_print massif.out.<pid>

# Heaptrack (modern alternative)
heaptrack ./build/debug/my_app
heaptrack_gui heaptrack.my_app.<pid>.gz
```

### Google Benchmark Integration

```cmake
find_package(benchmark REQUIRED)
add_executable(bench_solver benchmarks/bench_solver.cpp)
target_link_libraries(bench_solver benchmark::benchmark project_math)
```

```cpp
#include <benchmark/benchmark.h>
#include "project/math/solver.hpp"

static void BM_SolveLinearSystem(benchmark::State& state) {
  const int N = state.range(0);
  auto A = MakeRandomMatrix(N, N);
  auto b = MakeRandomVector(N);

  for (auto _ : state) {
    auto x = Solve(A, b);
    benchmark::DoNotOptimize(x);
  }
  state.SetComplexityN(N);
  state.SetItemsProcessed(state.iterations() * N * N);
}

BENCHMARK(BM_SolveLinearSystem)
    ->RangeMultiplier(2)
    ->Range(64, 4096)
    ->Complexity()
    ->Unit(benchmark::kMillisecond);

BENCHMARK_MAIN();
```

## Cross-Compilation

```json
// CMakePresets.json — cross-compile preset
{
  "name": "aarch64-linux",
  "inherits": "release",
  "toolchainFile": "${sourceDir}/cmake/toolchains/aarch64-linux-gnu.cmake",
  "cacheVariables": {
    "CMAKE_SYSTEM_NAME": "Linux",
    "CMAKE_SYSTEM_PROCESSOR": "aarch64"
  }
}
```

```cmake
# cmake/toolchains/aarch64-linux-gnu.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/aarch64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

## CI/CD Template (GitHub Actions)

```yaml
name: C++ CI
on: [push, pull_request]

jobs:
  build:
    strategy:
      matrix:
        preset: [debug, release, sanitize]
        os: [ubuntu-24.04]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: hendrikmuhs/ccache-action@v1
      - name: Install deps
        run: |
          sudo apt-get update
          sudo apt-get install -y ninja-build
      - name: Configure
        run: cmake --preset ${{ matrix.preset }} -GNinja
      - name: Build
        run: cmake --build --preset ${{ matrix.preset }}
      - name: Test
        run: ctest --preset ${{ matrix.preset }}

  analyze:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - name: Configure
        run: cmake --preset debug -GNinja
      - name: Build
        run: cmake --build --preset debug
      - name: clang-tidy
        run: run-clang-tidy -p build/debug 'src/.*\.(cpp|hpp)$'
      - name: cppcheck
        run: |
          cppcheck --project=build/debug/compile_commands.json \
                   --enable=warning,performance \
                   --error-exitcode=1
```

## Key Principles

1. **Reproducible builds** — CMake Presets + locked dependencies
2. **Fast iteration** — ccache + PCH + mold linker
3. **Catch bugs early** — clang-tidy + sanitizers in CI
4. **Clean boundaries** — layered libraries, no circular deps
5. **Profile before optimize** — perf/flamegraph, not guesswork
6. **Scale the build** — unity builds for CI, incremental for dev
