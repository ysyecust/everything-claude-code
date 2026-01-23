---
description: Configure your preferred C++ build system (CMake/Make) and compiler (GCC/Clang)
disable-model-invocation: true
---

# Build System Setup

Configure your preferred build system and compiler for C++20 HPC projects.

## Usage

```bash
# Detect current build system and compiler
node scripts/setup-build-system.js --detect

# Set global build system preference
node scripts/setup-build-system.js --global cmake

# List available build systems and compilers
node scripts/setup-build-system.js --list
```

## Detection Priority

When determining which build system to use, the following order is checked:

1. **Environment variable**: `CLAUDE_BUILD_SYSTEM`
2. **Project config**: `.claude/build-system.json`
3. **Project files**: Presence of CMakeLists.txt or Makefile
4. **Global config**: `~/.claude/build-system.json`
5. **Fallback**: First available build system (cmake > make)

## Compiler Detection

Compiler selection priority:

1. **Environment variable**: `CLAUDE_CXX_COMPILER`
2. **System detection**: First available (clang++ > g++)
3. **Default**: g++

## Configuration Files

### Global Configuration
```json
// ~/.claude/build-system.json
{
  "buildSystem": "cmake"
}
```

### Project Configuration
```json
// .claude/build-system.json
{
  "buildSystem": "cmake"
}
```

## Environment Variables

```bash
# Set build system
export CLAUDE_BUILD_SYSTEM=cmake

# Set compiler
export CLAUDE_CXX_COMPILER=clang++
```

## Run the Detection

To see current build system detection results, run:

```bash
node scripts/setup-build-system.js --detect
```
