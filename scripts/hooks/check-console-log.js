#!/usr/bin/env node

/**
 * Stop Hook: Check for debug output statements in modified files
 *
 * This hook runs after each response and checks if any modified
 * C++/JavaScript files contain debug output statements.
 * It provides warnings to help developers remember to remove
 * debug statements before committing.
 *
 * C++ patterns: std::cout, std::cerr, printf, fprintf(stderr, ...)
 * JS patterns: console.log
 */

const { execSync } = require('child_process');
const fs = require('fs');

let data = '';

// Read stdin
process.stdin.on('data', chunk => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    // Check if we're in a git repository
    try {
      execSync('git rev-parse --git-dir', { stdio: 'pipe' });
    } catch {
      // Not in a git repo, just pass through the data
      console.log(data);
      process.exit(0);
    }

    // Get list of modified files
    const files = execSync('git diff --name-only HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    })
      .split('\n')
      .filter(f => /\.(cpp|cc|cxx|hpp|h|ts|tsx|js|jsx)$/.test(f) && fs.existsSync(f));

    let hasDebugOutput = false;

    // Check each file for debug output
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const isCpp = /\.(cpp|cc|cxx|hpp|h)$/.test(file);
      const isJs = /\.(ts|tsx|js|jsx)$/.test(file);

      if (isCpp) {
        // Check for C++ debug output patterns
        if (/\bstd::cout\b/.test(content) || /\bprintf\s*\(/.test(content) || /\bfprintf\s*\(\s*stderr/.test(content)) {
          console.error(`[Hook] WARNING: debug output (std::cout/printf) found in ${file}`);
          hasDebugOutput = true;
        }
      }

      if (isJs) {
        // Check for JS debug output patterns
        if (content.includes('console.log')) {
          console.error(`[Hook] WARNING: console.log found in ${file}`);
          hasDebugOutput = true;
        }
      }
    }

    if (hasDebugOutput) {
      console.error('[Hook] Remove debug output statements before committing');
    }
  } catch (_error) {
    // Silently ignore errors (git might not be available, etc.)
  }

  // Always output the original data
  console.log(data);
});
