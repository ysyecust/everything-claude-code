/**
 * Build System Detection and Configuration
 * Automatically detects the build system (CMake/Make) and compiler
 *
 * Supports: CMake + Make/Ninja, with GCC/Clang/MSVC compilers
 */

const fs = require('fs');
const path = require('path');
const { commandExists, getClaudeDir, readFile, writeFile, log, runCommand } = require('./utils');

// Build system definitions
const BUILD_SYSTEMS = {
  cmake: {
    name: 'cmake',
    configFile: 'CMakeLists.txt',
    configureCmd: 'cmake -B build',
    buildCmd: 'cmake --build build',
    testCmd: 'ctest --test-dir build --output-on-failure',
    cleanCmd: 'rm -rf build',
    buildDir: 'build'
  },
  make: {
    name: 'make',
    configFile: 'Makefile',
    configureCmd: '',
    buildCmd: 'make -j$(nproc)',
    testCmd: 'make test',
    cleanCmd: 'make clean',
    buildDir: '.'
  }
};

// Compiler definitions
const COMPILERS = {
  gcc: {
    name: 'g++',
    cc: 'gcc',
    cxx: 'g++',
    std_flag: '-std=c++20',
    warn_flags: '-Wall -Wextra -Wpedantic',
    sanitize_flags: '-fsanitize=address,undefined -fno-omit-frame-pointer'
  },
  clang: {
    name: 'clang++',
    cc: 'clang',
    cxx: 'clang++',
    std_flag: '-std=c++20',
    warn_flags: '-Wall -Wextra -Wpedantic',
    sanitize_flags: '-fsanitize=address,undefined -fno-omit-frame-pointer'
  }
};

// Priority order for detection
const BUILD_SYSTEM_PRIORITY = ['cmake', 'make'];
const COMPILER_PRIORITY = ['clang', 'gcc'];

// Config file path
function getConfigPath() {
  return path.join(getClaudeDir(), 'build-system.json');
}

/**
 * Load saved build system configuration
 */
function loadConfig() {
  const configPath = getConfigPath();
  const content = readFile(configPath);

  if (content) {
    try {
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Save build system configuration
 */
function saveConfig(config) {
  const configPath = getConfigPath();
  writeFile(configPath, JSON.stringify(config, null, 2));
}

/**
 * Detect build system from project files
 */
function detectBuildSystem(projectDir = process.cwd()) {
  for (const bsName of BUILD_SYSTEM_PRIORITY) {
    const bs = BUILD_SYSTEMS[bsName];
    const configPath = path.join(projectDir, bs.configFile);

    if (fs.existsSync(configPath)) {
      return bsName;
    }
  }
  return null;
}

/**
 * Detect available C++ compiler
 */
function detectCompiler() {
  for (const compName of COMPILER_PRIORITY) {
    const comp = COMPILERS[compName];
    if (commandExists(comp.cxx)) {
      return compName;
    }
  }
  return null;
}

/**
 * Get available build systems (installed on system)
 */
function getAvailableBuildSystems() {
  const available = [];
  for (const bsName of Object.keys(BUILD_SYSTEMS)) {
    const cmd = bsName === 'cmake' ? 'cmake' : 'make';
    if (commandExists(cmd)) {
      available.push(bsName);
    }
  }
  return available;
}

/**
 * Get available compilers
 */
function getAvailableCompilers() {
  const available = [];
  for (const compName of Object.keys(COMPILERS)) {
    if (commandExists(COMPILERS[compName].cxx)) {
      available.push(compName);
    }
  }
  return available;
}

/**
 * Get the build system to use for current project
 *
 * Detection priority:
 * 1. Environment variable CLAUDE_BUILD_SYSTEM
 * 2. Project-specific config (in .claude/build-system.json)
 * 3. Project file detection (CMakeLists.txt, Makefile)
 * 4. Global user preference
 * 5. First available build system
 */
function getBuildSystem(options = {}) {
  const { projectDir = process.cwd() } = options;

  // 1. Check environment variable
  const envBs = process.env.CLAUDE_BUILD_SYSTEM;
  if (envBs && BUILD_SYSTEMS[envBs]) {
    return {
      name: envBs,
      config: BUILD_SYSTEMS[envBs],
      source: 'environment'
    };
  }

  // 2. Check project-specific config
  const projectConfigPath = path.join(projectDir, '.claude', 'build-system.json');
  const projectConfig = readFile(projectConfigPath);
  if (projectConfig) {
    try {
      const config = JSON.parse(projectConfig);
      if (config.buildSystem && BUILD_SYSTEMS[config.buildSystem]) {
        return {
          name: config.buildSystem,
          config: BUILD_SYSTEMS[config.buildSystem],
          source: 'project-config'
        };
      }
    } catch {
      // Invalid config
    }
  }

  // 3. Detect from project files
  const detected = detectBuildSystem(projectDir);
  if (detected) {
    return {
      name: detected,
      config: BUILD_SYSTEMS[detected],
      source: 'project-file'
    };
  }

  // 4. Check global user preference
  const globalConfig = loadConfig();
  if (globalConfig && globalConfig.buildSystem && BUILD_SYSTEMS[globalConfig.buildSystem]) {
    return {
      name: globalConfig.buildSystem,
      config: BUILD_SYSTEMS[globalConfig.buildSystem],
      source: 'global-config'
    };
  }

  // 5. Use first available
  const available = getAvailableBuildSystems();
  if (available.length > 0) {
    return {
      name: available[0],
      config: BUILD_SYSTEMS[available[0]],
      source: 'fallback'
    };
  }

  // Default to cmake
  return {
    name: 'cmake',
    config: BUILD_SYSTEMS.cmake,
    source: 'default'
  };
}

/**
 * Get the compiler to use
 */
function getCompiler(options = {}) {
  const envComp = process.env.CLAUDE_CXX_COMPILER;
  if (envComp) {
    for (const [name, comp] of Object.entries(COMPILERS)) {
      if (comp.cxx === envComp || name === envComp) {
        return { name, config: comp, source: 'environment' };
      }
    }
  }

  const detected = detectCompiler();
  if (detected) {
    return { name: detected, config: COMPILERS[detected], source: 'detected' };
  }

  return { name: 'gcc', config: COMPILERS.gcc, source: 'default' };
}

/**
 * Get the configure command for the project
 */
function getConfigureCommand(options = {}) {
  const bs = getBuildSystem(options);
  const comp = getCompiler(options);

  if (bs.name === 'cmake') {
    return `cmake -B build -DCMAKE_CXX_COMPILER=${comp.config.cxx} -DCMAKE_BUILD_TYPE=Debug -DBUILD_TESTING=ON`;
  }
  return bs.config.configureCmd;
}

/**
 * Get the build command
 */
function getBuildCommand(options = {}) {
  const bs = getBuildSystem(options);
  if (bs.name === 'cmake') {
    return 'cmake --build build -j$(nproc)';
  }
  return bs.config.buildCmd;
}

/**
 * Get the test command
 */
function getTestCommand(options = {}) {
  const bs = getBuildSystem(options);
  return bs.config.testCmd;
}

/**
 * Get build command with sanitizers
 */
function getSanitizerBuildCommand(sanitizer = 'address', options = {}) {
  const comp = getCompiler(options);
  const sanFlag = {
    address: '-fsanitize=address -fno-omit-frame-pointer',
    undefined: '-fsanitize=undefined',
    thread: '-fsanitize=thread',
    memory: '-fsanitize=memory -fno-omit-frame-pointer'
  }[sanitizer] || '-fsanitize=address';

  return `cmake -B build-${sanitizer} -DCMAKE_BUILD_TYPE=Debug -DCMAKE_CXX_FLAGS="${sanFlag}" && cmake --build build-${sanitizer}`;
}

/**
 * Generate a regex pattern that matches build/test commands
 */
function getCommandPattern(action) {
  const patterns = [];

  if (action === 'build') {
    patterns.push('cmake --build', 'make( -j\\d*)?', 'ninja');
  } else if (action === 'test') {
    patterns.push('ctest', 'make test');
  } else if (action === 'configure') {
    patterns.push('cmake -B', 'cmake -S');
  } else if (action === 'run') {
    patterns.push('mpirun', 'mpiexec', 'srun', '\\./build/');
  }

  return `(${patterns.join('|')})`;
}

/**
 * Get info message about detected build system
 */
function getSelectionPrompt() {
  const bs = getBuildSystem();
  const comp = getCompiler();
  const availableBs = getAvailableBuildSystems();
  const availableComp = getAvailableCompilers();

  let message = `[BuildSystem] Detected: ${bs.name} (source: ${bs.source})\n`;
  message += `[Compiler] Detected: ${comp.config.cxx} (source: ${comp.source})\n`;
  message += `\nAvailable build systems: ${availableBs.join(', ')}\n`;
  message += `Available compilers: ${availableComp.map(c => COMPILERS[c].cxx).join(', ')}\n`;

  return message;
}

module.exports = {
  BUILD_SYSTEMS,
  COMPILERS,
  getBuildSystem,
  getCompiler,
  getAvailableBuildSystems,
  getAvailableCompilers,
  detectBuildSystem,
  detectCompiler,
  getConfigureCommand,
  getBuildCommand,
  getTestCommand,
  getSanitizerBuildCommand,
  getCommandPattern,
  getSelectionPrompt,
  loadConfig,
  saveConfig
};
