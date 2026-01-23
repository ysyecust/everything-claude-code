#!/usr/bin/env node
/**
 * Build System Setup Script
 *
 * Interactive script to configure preferred build system and compiler.
 * Can be run directly or via the /setup-build command.
 *
 * Usage:
 *   node scripts/setup-build-system.js --detect
 *   node scripts/setup-build-system.js --global cmake
 *   node scripts/setup-build-system.js --list
 */

const {
  BUILD_SYSTEMS,
  COMPILERS,
  getBuildSystem,
  getCompiler,
  getAvailableBuildSystems,
  getAvailableCompilers,
  getConfigureCommand,
  getBuildCommand,
  getTestCommand,
  getSelectionPrompt,
  saveConfig
} = require('./lib/build-system');
const { log } = require('./lib/utils');

function showHelp() {
  console.log(`
Build System Setup for Claude Code (C++20 HPC)

Usage:
  node scripts/setup-build-system.js [options] [build-system]

Options:
  --detect          Detect and show current build system and compiler
  --global <bs>     Set global build system preference (saves to ~/.claude/build-system.json)
  --compiler <cc>   Set preferred compiler (gcc or clang)
  --list            List available build systems and compilers
  --help            Show this help message

Build Systems:
  cmake             CMake (recommended for C++20 projects)
  make              GNU Make

Compilers:
  gcc               GCC (g++)
  clang             Clang (clang++)

Examples:
  # Detect current build system and compiler
  node scripts/setup-build-system.js --detect

  # Set cmake as global preference
  node scripts/setup-build-system.js --global cmake

  # List available build systems
  node scripts/setup-build-system.js --list
`);
}

function detectAndShow() {
  const bsResult = getBuildSystem();
  const compResult = getCompiler();
  const availableBs = getAvailableBuildSystems();
  const availableComp = getAvailableCompilers();

  console.log('\n=== Build System Detection ===\n');

  console.log('Current selection:');
  console.log(`  Build System: ${bsResult.name}`);
  console.log(`  Source: ${bsResult.source}`);
  console.log(`  Compiler: ${compResult.config.cxx}`);
  console.log(`  Compiler Source: ${compResult.source}`);
  console.log('');

  console.log('Detection results:');
  console.log(`  Environment (CLAUDE_BUILD_SYSTEM): ${process.env.CLAUDE_BUILD_SYSTEM || 'not set'}`);
  console.log(`  Environment (CLAUDE_CXX_COMPILER): ${process.env.CLAUDE_CXX_COMPILER || 'not set'}`);
  console.log('');

  console.log('Available build systems:');
  for (const bsName of Object.keys(BUILD_SYSTEMS)) {
    const installed = availableBs.includes(bsName);
    const indicator = installed ? '✓' : '✗';
    const current = bsName === bsResult.name ? ' (current)' : '';
    console.log(`  ${indicator} ${bsName}${current}`);
  }
  console.log('');

  console.log('Available compilers:');
  for (const compName of Object.keys(COMPILERS)) {
    const installed = availableComp.includes(compName);
    const indicator = installed ? '✓' : '✗';
    const current = compName === compResult.name ? ' (current)' : '';
    console.log(`  ${indicator} ${COMPILERS[compName].cxx}${current}`);
  }
  console.log('');

  console.log('Commands:');
  console.log(`  Configure: ${getConfigureCommand()}`);
  console.log(`  Build: ${getBuildCommand()}`);
  console.log(`  Test: ${getTestCommand()}`);
  console.log('');
}

function listAvailable() {
  const availableBs = getAvailableBuildSystems();
  const availableComp = getAvailableCompilers();
  const bsResult = getBuildSystem();
  const compResult = getCompiler();

  console.log('\nAvailable Build Systems:\n');

  for (const [bsName, config] of Object.entries(BUILD_SYSTEMS)) {
    const installed = availableBs.includes(bsName);
    const current = bsName === bsResult.name ? ' (current)' : '';

    console.log(`${bsName}${current}`);
    console.log(`  Installed: ${installed ? 'Yes' : 'No'}`);
    console.log(`  Config File: ${config.configFile}`);
    console.log(`  Build: ${config.buildCmd}`);
    console.log(`  Test: ${config.testCmd}`);
    console.log('');
  }

  console.log('Available Compilers:\n');

  for (const [compName, config] of Object.entries(COMPILERS)) {
    const installed = availableComp.includes(compName);
    const current = compName === compResult.name ? ' (current)' : '';

    console.log(`${compName}${current}`);
    console.log(`  Installed: ${installed ? 'Yes' : 'No'}`);
    console.log(`  C++: ${config.cxx}`);
    console.log(`  C: ${config.cc}`);
    console.log(`  Standard: ${config.std_flag}`);
    console.log('');
  }
}

function setGlobal(bsName) {
  if (!BUILD_SYSTEMS[bsName]) {
    console.error(`Error: Unknown build system "${bsName}"`);
    console.error(`Available: ${Object.keys(BUILD_SYSTEMS).join(', ')}`);
    process.exit(1);
  }

  const available = getAvailableBuildSystems();
  if (!available.includes(bsName)) {
    console.warn(`Warning: ${bsName} is not installed on your system`);
  }

  try {
    saveConfig({ buildSystem: bsName });
    console.log(`\n✓ Global preference set to: ${bsName}`);
    console.log('  Saved to: ~/.claude/build-system.json');
    console.log('');
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

if (args.includes('--detect')) {
  detectAndShow();
  process.exit(0);
}

if (args.includes('--list')) {
  listAvailable();
  process.exit(0);
}

const globalIdx = args.indexOf('--global');
if (globalIdx !== -1) {
  const bsName = args[globalIdx + 1];
  if (!bsName) {
    console.error('Error: --global requires a build system name');
    process.exit(1);
  }
  setGlobal(bsName);
  process.exit(0);
}

// If just a build system name is provided, set it globally
const bsName = args[0];
if (BUILD_SYSTEMS[bsName]) {
  setGlobal(bsName);
} else {
  console.error(`Error: Unknown option or build system "${bsName}"`);
  showHelp();
  process.exit(1);
}
