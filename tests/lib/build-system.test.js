/**
 * Tests for scripts/lib/build-system.js
 *
 * Run with: node tests/lib/build-system.test.js
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Import the modules
const bs = require('../../scripts/lib/build-system');

// Test helper
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    return true;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
    return false;
  }
}

// Create a temporary test directory
function createTestDir() {
  const testDir = path.join(os.tmpdir(), `bs-test-${Date.now()}`);
  fs.mkdirSync(testDir, { recursive: true });
  return testDir;
}

// Clean up test directory
function cleanupTestDir(testDir) {
  fs.rmSync(testDir, { recursive: true, force: true });
}

// Test suite
function runTests() {
  console.log('\n=== Testing build-system.js ===\n');

  let passed = 0;
  let failed = 0;

  // BUILD_SYSTEMS constant tests
  console.log('BUILD_SYSTEMS Constant:');

  if (test('BUILD_SYSTEMS has all expected systems', () => {
    assert.ok(bs.BUILD_SYSTEMS.cmake, 'Should have cmake');
    assert.ok(bs.BUILD_SYSTEMS.make, 'Should have make');
  })) passed++; else failed++;

  if (test('Each build system has required properties', () => {
    const requiredProps = ['name', 'configFile', 'buildCmd', 'testCmd', 'cleanCmd', 'buildDir'];
    for (const [name, config] of Object.entries(bs.BUILD_SYSTEMS)) {
      for (const prop of requiredProps) {
        assert.ok(config[prop] !== undefined, `${name} should have ${prop}`);
      }
    }
  })) passed++; else failed++;

  // COMPILERS constant tests
  console.log('\nCOMPILERS Constant:');

  if (test('COMPILERS has all expected compilers', () => {
    assert.ok(bs.COMPILERS.gcc, 'Should have gcc');
    assert.ok(bs.COMPILERS.clang, 'Should have clang');
  })) passed++; else failed++;

  if (test('Each compiler has required properties', () => {
    const requiredProps = ['name', 'cc', 'cxx', 'std_flag', 'warn_flags', 'sanitize_flags'];
    for (const [name, config] of Object.entries(bs.COMPILERS)) {
      for (const prop of requiredProps) {
        assert.ok(config[prop], `${name} should have ${prop}`);
      }
    }
  })) passed++; else failed++;

  // detectBuildSystem tests
  console.log('\ndetectBuildSystem:');

  if (test('detects cmake from CMakeLists.txt', () => {
    const testDir = createTestDir();
    try {
      fs.writeFileSync(path.join(testDir, 'CMakeLists.txt'), 'cmake_minimum_required(VERSION 3.20)');
      const result = bs.detectBuildSystem(testDir);
      assert.strictEqual(result, 'cmake');
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  if (test('detects make from Makefile', () => {
    const testDir = createTestDir();
    try {
      fs.writeFileSync(path.join(testDir, 'Makefile'), 'all:\n\techo hello');
      const result = bs.detectBuildSystem(testDir);
      assert.strictEqual(result, 'make');
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  if (test('returns null when no build file exists', () => {
    const testDir = createTestDir();
    try {
      const result = bs.detectBuildSystem(testDir);
      assert.strictEqual(result, null);
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  if (test('respects detection priority (cmake > make)', () => {
    const testDir = createTestDir();
    try {
      fs.writeFileSync(path.join(testDir, 'CMakeLists.txt'), 'cmake_minimum_required(VERSION 3.20)');
      fs.writeFileSync(path.join(testDir, 'Makefile'), 'all:\n\techo hello');
      const result = bs.detectBuildSystem(testDir);
      assert.strictEqual(result, 'cmake');
    } finally {
      cleanupTestDir(testDir);
    }
  })) passed++; else failed++;

  // getBuildSystem tests
  console.log('\ngetBuildSystem:');

  if (test('returns object with name, config, and source', () => {
    const result = bs.getBuildSystem();
    assert.ok(result.name, 'Should have name');
    assert.ok(result.config, 'Should have config');
    assert.ok(result.source, 'Should have source');
  })) passed++; else failed++;

  if (test('respects environment variable', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    try {
      process.env.CLAUDE_BUILD_SYSTEM = 'make';
      const result = bs.getBuildSystem();
      assert.strictEqual(result.name, 'make');
      assert.strictEqual(result.source, 'environment');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      } else {
        delete process.env.CLAUDE_BUILD_SYSTEM;
      }
    }
  })) passed++; else failed++;

  if (test('detects from project files', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    delete process.env.CLAUDE_BUILD_SYSTEM;

    const testDir = createTestDir();
    try {
      fs.writeFileSync(path.join(testDir, 'CMakeLists.txt'), 'cmake_minimum_required(VERSION 3.20)');
      const result = bs.getBuildSystem({ projectDir: testDir });
      assert.strictEqual(result.name, 'cmake');
      assert.strictEqual(result.source, 'project-file');
    } finally {
      cleanupTestDir(testDir);
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      }
    }
  })) passed++; else failed++;

  // getCompiler tests
  console.log('\ngetCompiler:');

  if (test('returns object with name, config, and source', () => {
    const result = bs.getCompiler();
    assert.ok(result.name, 'Should have name');
    assert.ok(result.config, 'Should have config');
    assert.ok(result.source, 'Should have source');
  })) passed++; else failed++;

  if (test('respects environment variable', () => {
    const originalEnv = process.env.CLAUDE_CXX_COMPILER;
    try {
      process.env.CLAUDE_CXX_COMPILER = 'clang++';
      const result = bs.getCompiler();
      assert.strictEqual(result.name, 'clang');
      assert.strictEqual(result.source, 'environment');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_CXX_COMPILER = originalEnv;
      } else {
        delete process.env.CLAUDE_CXX_COMPILER;
      }
    }
  })) passed++; else failed++;

  // getConfigureCommand tests
  console.log('\ngetConfigureCommand:');

  if (test('returns cmake configure command', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    try {
      process.env.CLAUDE_BUILD_SYSTEM = 'cmake';
      const cmd = bs.getConfigureCommand();
      assert.ok(cmd.includes('cmake -B build'), 'Should include cmake -B build');
      assert.ok(cmd.includes('-DCMAKE_BUILD_TYPE=Debug'), 'Should include debug build type');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      } else {
        delete process.env.CLAUDE_BUILD_SYSTEM;
      }
    }
  })) passed++; else failed++;

  // getBuildCommand tests
  console.log('\ngetBuildCommand:');

  if (test('returns cmake build command', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    try {
      process.env.CLAUDE_BUILD_SYSTEM = 'cmake';
      const cmd = bs.getBuildCommand();
      assert.ok(cmd.includes('cmake --build build'), 'Should include cmake --build build');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      } else {
        delete process.env.CLAUDE_BUILD_SYSTEM;
      }
    }
  })) passed++; else failed++;

  if (test('returns make build command', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    try {
      process.env.CLAUDE_BUILD_SYSTEM = 'make';
      const cmd = bs.getBuildCommand();
      assert.ok(cmd.includes('make'), 'Should include make');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      } else {
        delete process.env.CLAUDE_BUILD_SYSTEM;
      }
    }
  })) passed++; else failed++;

  // getTestCommand tests
  console.log('\ngetTestCommand:');

  if (test('returns ctest command for cmake', () => {
    const originalEnv = process.env.CLAUDE_BUILD_SYSTEM;
    try {
      process.env.CLAUDE_BUILD_SYSTEM = 'cmake';
      const cmd = bs.getTestCommand();
      assert.ok(cmd.includes('ctest'), 'Should include ctest');
    } finally {
      if (originalEnv !== undefined) {
        process.env.CLAUDE_BUILD_SYSTEM = originalEnv;
      } else {
        delete process.env.CLAUDE_BUILD_SYSTEM;
      }
    }
  })) passed++; else failed++;

  // getCommandPattern tests
  console.log('\ngetCommandPattern:');

  if (test('generates pattern for build command', () => {
    const pattern = bs.getCommandPattern('build');
    assert.ok(pattern.includes('cmake --build'), 'Should include cmake --build');
    assert.ok(pattern.includes('make'), 'Should include make');
    assert.ok(pattern.includes('ninja'), 'Should include ninja');
  })) passed++; else failed++;

  if (test('generates pattern for test command', () => {
    const pattern = bs.getCommandPattern('test');
    assert.ok(pattern.includes('ctest'), 'Should include ctest');
    assert.ok(pattern.includes('make test'), 'Should include make test');
  })) passed++; else failed++;

  if (test('generates pattern for run command', () => {
    const pattern = bs.getCommandPattern('run');
    assert.ok(pattern.includes('mpirun'), 'Should include mpirun');
    assert.ok(pattern.includes('mpiexec'), 'Should include mpiexec');
  })) passed++; else failed++;

  // getSelectionPrompt tests
  console.log('\ngetSelectionPrompt:');

  if (test('returns informative prompt', () => {
    const prompt = bs.getSelectionPrompt();
    assert.ok(prompt.includes('BuildSystem'), 'Should mention BuildSystem');
    assert.ok(prompt.includes('Compiler'), 'Should mention Compiler');
  })) passed++; else failed++;

  // getSanitizerBuildCommand tests
  console.log('\ngetSanitizerBuildCommand:');

  if (test('returns address sanitizer command', () => {
    const cmd = bs.getSanitizerBuildCommand('address');
    assert.ok(cmd.includes('-fsanitize=address'), 'Should include address sanitizer flag');
    assert.ok(cmd.includes('cmake'), 'Should use cmake');
  })) passed++; else failed++;

  if (test('returns thread sanitizer command', () => {
    const cmd = bs.getSanitizerBuildCommand('thread');
    assert.ok(cmd.includes('-fsanitize=thread'), 'Should include thread sanitizer flag');
  })) passed++; else failed++;

  // Summary
  console.log('\n=== Test Results ===');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total:  ${passed + failed}\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
