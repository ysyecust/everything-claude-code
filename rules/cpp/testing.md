# Testing Requirements

## Minimum Test Coverage: 80%

Test Types (ALL required):
1. **Unit Tests** - Individual functions, classes, templates (Google Test)
2. **Integration Tests** - Multi-component interactions, I/O, MPI communication
3. **Performance Tests** - Regression benchmarks, scalability verification

## Test-Driven Development

MANDATORY workflow:
1. Write test first (RED)
2. Run test - it should FAIL: `ctest --test-dir build -R <test_name>`
3. Write minimal implementation (GREEN)
4. Run test - it should PASS
5. Refactor (IMPROVE)
6. Verify coverage (80%+): `gcov` / `lcov`

## Testing Framework: Google Test + CTest

### Build with Tests
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON
cmake --build build
ctest --test-dir build --output-on-failure
```

### Coverage Analysis
```bash
cmake -B build -DCMAKE_BUILD_TYPE=Debug \
  -DCMAKE_CXX_FLAGS="--coverage -fprofile-arcs -ftest-coverage"
cmake --build build
ctest --test-dir build
lcov --capture --directory build --output-file coverage.info
lcov --remove coverage.info '/usr/*' '*/test/*' --output-file coverage.info
genhtml coverage.info --output-directory coverage_report
# Open coverage_report/index.html
```

## Troubleshooting Test Failures

1. Use **tdd-guide** agent
2. Check test isolation (no shared mutable state)
3. Verify mocks are correct (Google Mock)
4. Fix implementation, not tests (unless tests are wrong)
5. Run with sanitizers to detect UB:
   ```bash
   cmake -B build -DCMAKE_CXX_FLAGS="-fsanitize=address,undefined"
   ```

## Agent Support

- **tdd-guide** - Use PROACTIVELY for new features, enforces write-tests-first
- **integration-test-runner** - Multi-process integration testing specialist
