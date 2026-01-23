# Test Coverage

Analyze test coverage and generate missing tests using gcov/lcov:

1. Build with coverage instrumentation:
   ```bash
   cmake -B build-cov -DCMAKE_BUILD_TYPE=Debug \
     -DCMAKE_CXX_FLAGS="--coverage -fprofile-arcs -ftest-coverage"
   cmake --build build-cov
   ```

2. Run all tests:
   ```bash
   ctest --test-dir build-cov --output-on-failure
   ```

3. Generate coverage report:
   ```bash
   lcov --capture --directory build-cov --output-file coverage.info
   lcov --remove coverage.info '/usr/*' '*/test/*' '*/build/*' --output-file coverage.info
   genhtml coverage.info --output-directory coverage_report
   lcov --summary coverage.info
   ```

4. Identify files below 80% coverage threshold

5. For each under-covered file:
   - Analyze untested code paths (uncovered lines in lcov report)
   - Generate unit tests for uncovered functions
   - Generate integration tests for uncovered error paths
   - Add edge case tests (empty input, overflow, boundary values)

6. Verify new tests pass:
   ```bash
   cmake --build build-cov && ctest --test-dir build-cov --output-on-failure
   ```

7. Re-run coverage and show before/after metrics

8. Ensure project reaches 80%+ overall coverage

Focus on:
- Untested branches (if/else paths)
- Error handling paths (catch blocks, error returns)
- Edge cases (empty containers, zero values, max values)
- Boundary conditions (off-by-one, overflow)
- Template instantiations with different types
