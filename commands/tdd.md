---
description: Enforce C++20 test-driven development workflow. Scaffold interfaces, generate Google Test cases FIRST, then implement minimal code to pass. Ensure 80%+ coverage via gcov/lcov.
---

# TDD Command

This command invokes the **tdd-guide** agent to enforce test-driven development for C++20.

## What This Command Does

1. **Scaffold Interface** - Define C++ header with class/function declarations
2. **Generate Tests First** - Write failing Google Test cases (RED)
3. **Implement Minimal Code** - Write just enough to pass (GREEN)
4. **Refactor** - Improve code while keeping tests green (REFACTOR)
5. **Verify Coverage** - Ensure 80%+ test coverage via gcov/lcov

## When to Use

Use `/tdd` when:
- Implementing new C++ classes or functions
- Adding new solver components or algorithms
- Fixing bugs (write test that reproduces bug first)
- Refactoring existing code
- Building critical numerical computations

## How It Works

The tdd-guide agent will:

1. **Define interface** in a header file (.hpp)
2. **Write Google Test** that will FAIL (because implementation is a stub)
3. **Build and run tests**: `cmake --build build && ctest --test-dir build -R <test>`
4. **Verify tests fail** for the right reason
5. **Write minimal implementation** (.cpp) to make tests pass
6. **Re-run tests** and verify they pass
7. **Refactor** code while keeping tests green
8. **Check coverage** via gcov/lcov and add tests if below 80%

## TDD Cycle

```
RED -> GREEN -> REFACTOR -> REPEAT

RED:      Write a failing Google Test
GREEN:    Write minimal C++ code to pass
REFACTOR: Improve code, keep tests passing
REPEAT:   Next feature/scenario
```

## Example Usage

```
User: /tdd I need a function to compute the L2 norm of a vector

Agent (tdd-guide):
# TDD Session: L2 Norm Computation

## Step 1: Define Interface (SCAFFOLD)

// include/project/math/norm.hpp
#pragma once
#include <span>

namespace project::math {

[[nodiscard]] double L2Norm(std::span<const double> x);

}  // namespace project::math

## Step 2: Write Failing Test (RED)

// tests/unit/test_norm.cpp
#include <gtest/gtest.h>
#include "project/math/norm.hpp"

TEST(L2NormTest, ComputesCorrectly) {
  std::vector<double> v = {3.0, 4.0};
  EXPECT_NEAR(project::math::L2Norm(v), 5.0, 1e-14);
}

TEST(L2NormTest, HandlesEmptyVector) {
  EXPECT_DOUBLE_EQ(project::math::L2Norm({}), 0.0);
}

TEST(L2NormTest, HandlesSingleElement) {
  std::vector<double> v = {-7.0};
  EXPECT_NEAR(project::math::L2Norm(v), 7.0, 1e-14);
}

## Step 3: Run Tests - Verify FAIL
cmake --build build && ctest --test-dir build -R test_norm
# FAIL: undefined reference (not implemented yet)

## Step 4: Implement (GREEN)

// src/math/norm.cpp
#include "project/math/norm.hpp"
#include <cmath>
#include <numeric>

namespace project::math {

double L2Norm(std::span<const double> x) {
  if (x.empty()) return 0.0;
  double sum = std::inner_product(x.begin(), x.end(), x.begin(), 0.0);
  return std::sqrt(sum);
}

}  // namespace project::math

## Step 5: Run Tests - Verify PASS
cmake --build build && ctest --test-dir build -R test_norm
# 3 tests PASS

## Step 6: Check Coverage
lcov + genhtml -> 100% coverage
```

## Coverage Requirements

- **80% minimum** for all code
- **100% required** for:
  - Numerical algorithms
  - Memory management code
  - Parallel/concurrent code
  - Security-critical code

## Integration with Other Commands

- Use `/plan` first to understand what to build
- Use `/tdd` to implement with tests
- Use `/build-fix` if build errors occur
- Use `/code-review` to review implementation
- Use `/test-coverage` to verify coverage

## Related Agents

This command invokes the `tdd-guide` agent.
