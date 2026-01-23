---
description: Generate and run integration tests for C++20 HPC applications. Creates multi-process tests, manages CTest labels, verifies solver pipelines, and detects performance regressions.
---

# Integration Test Command

This command invokes the **integration-test-runner** agent to generate, maintain, and execute integration tests for C++20 HPC applications.

## What This Command Does

1. **Generate Integration Tests** - Create tests for multi-component pipelines
2. **Run Tests by Label** - Execute with CTest label filtering
3. **MPI Testing** - Multi-process tests with configurable rank counts
4. **Performance Regression** - Detect and report slowdowns
5. **I/O Validation** - File format round-trip verification

## When to Use

Use `/integration-test` when:
- Testing solver pipelines end-to-end
- Verifying MPI communication patterns
- Checking I/O format compatibility
- Detecting performance regressions
- Validating multi-component interactions

## How It Works

The integration-test-runner agent will:

1. **Analyze components** and identify integration boundaries
2. **Generate tests** with proper CTest labels and fixtures
3. **Run tests**: `ctest --test-dir build -L integration --output-on-failure`
4. **Handle MPI tests**: `mpiexec -np 4 ./test_mpi_exchange`
5. **Measure performance** and compare to baselines
6. **Generate report** with results and timing data

## Example Usage

```
User: /integration-test Test the solver pipeline from mesh generation to solution output

Agent (integration-test-runner):
# Integration Test: Solver Pipeline

## Test Scenarios
1. Mesh generation -> Assembly -> CG solve -> File output
2. Parallel mesh partition -> MPI exchange -> Solve -> Gather
3. Performance: 1000x1000 system solves within 5s

## Generated Test

// tests/integration/test_solver_pipeline.cpp
TEST_F(SolverPipelineTest, EndToEndSolve) {
  auto mesh = GenerateMesh(32, 32);
  auto matrix = Assemble(mesh);
  auto result = Solve(matrix, rhs);
  EXPECT_TRUE(result.converged);
  WriteOutput("output.h5", result.solution);
  // Verify output file is valid
  auto loaded = ReadOutput("output.h5");
  EXPECT_EQ(loaded.size(), result.solution.size());
}

## Running
ctest --test-dir build -L integration --output-on-failure

## Results
3/3 tests passed (12.4s total)
```

## Test Labels

```bash
# All integration tests
ctest --test-dir build -L integration

# MPI-only tests
ctest --test-dir build -L mpi

# Performance benchmarks
ctest --test-dir build -L benchmark

# Exclude slow tests
ctest --test-dir build -L integration -LE benchmark
```

## Integration with Other Commands

- Use `/plan` to identify components to test
- Use `/tdd` for unit tests (faster, more granular)
- Use `/integration-test` for cross-component verification
- Use `/code-review` to verify test quality
- Use `/test-coverage` to check overall coverage

## Related Agents

This command invokes the `integration-test-runner` agent.
