**语言:** [English](#overview) | 中文（见各章节双语注释）

# Architecture & Capabilities

Everything Claude Code 的完整架构与功能说明。

---

## Overview

Everything Claude Code 是一个面向 **C++20 高性能计算 (HPC)** 开发的 Claude Code 插件生态系统。它通过 12 个专业 Agent、22 个 Skill、23 个 Command、7 条 Rule 和一套自动化 Hook 链，为 C++ 开发者提供从规划、编码、测试到安全审查的全流程辅助。

本项目 fork 自 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)，在保留上游多语言支持的基础上，专门适配了 C++20、CMake、Google Test、Sanitizer 等 HPC 工具链。

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code CLI                         │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐          │
│  │ Agents  │ │ Skills  │ │Commands │ │  Rules  │          │
│  │  (12)   │ │  (22)   │ │  (23)   │ │   (7)   │          │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘          │
│       │           │           │            │               │
│  ┌────▼───────────▼───────────▼────────────▼────┐          │
│  │              Hooks Engine (6 events)          │          │
│  │  PreToolUse │ PostToolUse │ Session* │ Stop   │          │
│  └────────────────────┬─────────────────────────┘          │
│                       │                                     │
│  ┌────────────────────▼─────────────────────────┐          │
│  │           Scripts (Node.js)                   │          │
│  │  lib/ │ hooks/ │ ci/ │ setup-build-system.js  │          │
│  └──────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │  Schemas │ Contexts │ Tests │ CI/CD Workflows │          │
│  └──────────────────────────────────────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Table of Contents

1. [Agent System](#1-agent-system)
2. [Skill System](#2-skill-system)
3. [Command System](#3-command-system)
4. [Rule System](#4-rule-system)
5. [Hook System](#5-hook-system)
6. [Script Architecture](#6-script-architecture)
7. [Context Modes](#7-context-modes)
8. [CI/CD Pipeline](#8-cicd-pipeline)
9. [Learning System](#9-learning-system)
10. [Workflow Examples](#10-workflow-examples)
11. [Plugin Infrastructure](#11-plugin-infrastructure)

---

## 1. Agent System

Agent 是可被委派任务的专业子代理。每个 Agent 有独立的 model 选择、tool 权限和领域知识。

### 1.1 架构

```
┌──────────────────────────────────────────────┐
│                Main Claude Session            │
│                                              │
│  User: "/tdd implement CG solver"            │
│       │                                      │
│       ▼                                      │
│  ┌──────────┐    delegates    ┌────────────┐ │
│  │ Command  │ ──────────────► │   Agent    │ │
│  │ /tdd     │                 │ tdd-guide  │ │
│  └──────────┘                 │ model:son. │ │
│                               │ tools: R/W │ │
│                               │   /E/B/Gr  │ │
│                               └────────────┘ │
└──────────────────────────────────────────────┘
```

每个 Agent 通过 Markdown frontmatter 定义：

```yaml
---
name: tdd-guide
description: C++20 Test-Driven Development specialist...
tools: ["Read", "Write", "Edit", "Bash", "Grep", "Glob"]
model: sonnet
---
```

### 1.2 Agent 分类

#### C++20 HPC 核心 Agent

| Agent | Model | 可用工具 | 职责 |
|-------|-------|---------|------|
| **tdd-guide** | Sonnet | Read/Write/Edit/Bash/Grep/Glob | TDD 执行：Scaffold → RED → GREEN → REFACTOR → Coverage |
| **code-reviewer** | Opus | Read/Grep/Glob/Bash | 审查内存安全、RAII、const 正确性、cache 性能、向量化机会 |
| **security-reviewer** | Opus | Read/Write/Edit/Bash/Grep/Glob | 运行 ASan/MSan/UBSan/TSan，执行 clang-tidy/cppcheck，标记 CWE Top 25 |
| **build-error-resolver** | Sonnet | Read/Write/Edit/Bash/Grep/Glob | 诊断 CMake 配置、链接错误、模板实例化、concept 约束失败 |
| **integration-test-runner** | Sonnet | Read/Write/Edit/Bash/Grep/Glob | CTest label 管理、MPI 多进程测试、性能回归检测 |

#### 通用 Agent

| Agent | Model | 可用工具 | 职责 |
|-------|-------|---------|------|
| **planner** | Opus | Read/Grep/Glob | 需求分析、风险评估、分步实施计划（等待用户确认后才动手） |
| **architect** | Opus | Read/Grep/Glob | 系统设计、可扩展性分析、技术决策（只读工具，不修改代码） |
| **refactor-cleaner** | Opus | Read/Write/Edit/Bash/Grep/Glob | 死代码检测（knip/depcheck）、重复消除、安全移除 |
| **doc-updater** | Opus | Read/Write/Edit/Bash/Grep/Glob | Codemap 生成、README 更新、AST 分析 |

#### 多语言 Agent（来自上游）

| Agent | Model | 职责 |
|-------|-------|------|
| **database-reviewer** | Opus | PostgreSQL 优化、RLS 策略、Supabase 模式审查 |
| **go-reviewer** | Opus | Go 惯用模式、并发安全、错误处理审查 |
| **go-build-resolver** | Opus | Go 编译错误诊断与修复 |

### 1.3 Model 选择策略

```
Opus  → 需要深度分析的任务（code-review, security-review, architecture）
Sonnet → 需要快速执行的任务（tdd, build-fix, integration-test）
Haiku  → 后台观察任务（continuous-learning observer）
```

**设计原则：**
- 只读 Agent（architect, planner）没有 Write/Edit 权限 → 不会意外修改代码
- 高安全 Agent（security-reviewer）使用 Opus → 减少漏报
- 高频 Agent（tdd-guide, build-error-resolver）使用 Sonnet → 平衡速度与质量

---

## 2. Skill System

Skill 提供领域知识和可复用模式。每个 Skill 是一个包含 `SKILL.md` 的目录，可被 Agent 和 Command 引用。

### 2.1 C++20 HPC Skill

#### coding-standards
C++20 编码标准：Google C++ Style 命名规范、concepts 约束、ranges 算法、constexpr/consteval、Doxygen 文档。

```cpp
// 命名示例
class LinearOperator {};          // PascalCase 类名
void ApplyOperator();             // PascalCase 方法
size_t num_rows;                  // snake_case 变量
constexpr int kMaxIterations;     // k 前缀常量
```

#### hpc-patterns
高性能计算核心模式：

- **SoA vs AoS** — Structure of Arrays 用于向量化友好的数据布局
- **SIMD 向量化** — 编译器提示（`__restrict__`、对齐、循环展开）
- **线程池** — `std::jthread` + 任务队列，避免线程创建开销
- **无锁数据结构** — `std::atomic` + CAS 操作的无锁栈
- **NUMA 感知** — `numa_alloc_onnode()` 本地内存分配
- **缓存友好** — 数据打包、预取、避免 false sharing

#### numerical-patterns
数值计算模式：

- **稀疏矩阵** — CSR 格式存储与 SpMV 操作
- **迭代求解器** — CG（共轭梯度）、GMRES、预条件子
- **数值稳定性** — Kahan 求和、条件数检查
- **HPC I/O** — MPI-IO 并行读写、HDF5 数据集操作
- **性能基准** — 计时框架、FLOPS 计算、内存带宽测量

#### tdd-workflow
Google Test/Mock TDD 方法论：

```
1. SCAFFOLD — 定义接口（header with declarations）
2. RED      — 写一个会失败的 Google Test
3. RUN      — 验证失败：cmake --build build && ctest -R <test>
4. GREEN    — 写最少的实现使测试通过
5. RUN      — 验证通过
6. REFACTOR — 改善代码，保持测试绿色
7. COVERAGE — gcov/lcov 验证 80%+
```

### 2.2 跨语言 Skill

#### continuous-learning-v2（Instinct 自学习系统）

核心概念：**Instinct**（直觉）—— 一个原子化的学习行为单元。

```
观察 → 模式识别 → Instinct 创建 → 置信度评分 → 演化为 Skill
```

- 置信度范围：0.3（低）→ 0.9（高）
- 证据链追踪：每个 instinct 关联产生它的观察记录
- 演化路径：相关 instincts 聚类 → 生成新的 skill/command/agent

#### iterative-retrieval（迭代检索）
解决子代理上下文不足的问题：渐进式增加上下文，直到子代理有足够信息完成任务。

#### strategic-compact（策略压缩）
在逻辑断点（而非任意自动压缩点）建议手动压缩，保留重要上下文。

#### security-review
安全审查清单：secrets 管理、输入验证、SQL 注入防护、XSS/CSRF 防护、云基础设施安全。

#### eval-harness
评估框架：为 Claude Code session 提供形式化的评估驱动开发（EDD）流程。

### 2.3 多语言 Skill（来自上游）

| Skill | 领域 |
|-------|------|
| golang-patterns / golang-testing | Go 惯用模式与测试 |
| springboot-patterns / springboot-tdd / springboot-security | Spring Boot 生态 |
| java-coding-standards / jpa-patterns | Java/JPA |
| postgres-patterns | PostgreSQL 查询优化 |
| clickhouse-io | ClickHouse 分析引擎 |

---

## 3. Command System

Command 是用户在 Claude Code 中输入的斜杠命令，触发特定工作流。

### 3.1 命令架构

每个命令是一个 Markdown 文件，通过 frontmatter 定义元数据：

```yaml
---
name: tdd
description: C++20 test-driven development workflow
user_invocable: true       # 用户可通过 /tdd 直接调用
agent: tdd-guide           # 委派给哪个 Agent
---
```

### 3.2 完整命令列表

#### 开发工作流

| 命令 | Agent | 功能 |
|------|-------|------|
| `/plan` | planner | 需求分析 → 风险评估 → 分步计划（等待确认） |
| `/tdd` | tdd-guide | TDD 循环：Scaffold → RED → GREEN → REFACTOR |
| `/build-fix` | build-error-resolver | 增量修复 CMake/C++20 构建错误 |
| `/code-review` | code-reviewer | git diff 的安全 + 质量审查 |
| `/test-coverage` | — | gcov/lcov 覆盖率报告 |
| `/integration-test` | integration-test-runner | CTest 集成测试 |
| `/verify` | — | 完整验证链（build → test → lint → coverage → security） |

#### 代码维护

| 命令 | Agent | 功能 |
|------|-------|------|
| `/refactor-clean` | refactor-cleaner | 死代码检测与清理 |
| `/update-codemaps` | doc-updater | 重新生成 docs/CODEMAPS/* |
| `/update-docs` | doc-updater | 更新 README 和文档 |
| `/setup-pm` | — | 配置构建系统检测 |

#### 学习系统

| 命令 | 功能 |
|------|------|
| `/learn` | 手动触发学习（continuous-learning-v2） |
| `/skill-create` | 从 git 历史生成 SKILL.md |
| `/instinct-status` | 查看已学习的 instincts 及置信度 |
| `/instinct-import` | 从文件/团队导入 instincts |
| `/instinct-export` | 导出 instincts 用于分享 |
| `/evolve` | 将相关 instincts 聚类为 skill/command/agent |

#### 高级工作流

| 命令 | 功能 |
|------|------|
| `/orchestrate` | 多 Agent 并行/串行编排 |
| `/checkpoint` | 保存 session 状态快照 |
| `/eval` | 运行评估框架 |

---

## 4. Rule System

Rule 是始终生效的强制性规则，注入到每次 Claude 交互的 system prompt 中。

### 4.1 规则列表

| 规则文件 | 核心要求 |
|----------|---------|
| **security.md** | 内存安全（无裸 new/delete）、数据竞争防护、整数溢出检查、CWE Top 25 合规 |
| **coding-style.md** | RAII（CRITICAL 级别）、const 正确性、移动语义、C++20 concepts/ranges、Google 命名 |
| **testing.md** | 80% 最低覆盖率、TDD 强制、Google Test + CTest、sanitizers in CI |
| **patterns.md** | `std::expected` 错误处理、CRTP、Builder 模式、Repository 模式 |
| **git-workflow.md** | Conventional Commits 格式、原子提交、分支命名规范 |
| **performance.md** | 缓存友好布局、向量化、基于 profiling 的优化（非猜测） |
| **agents.md** | Agent 调用时机、tool 限制、model 选择原则 |

### 4.2 关键安全规则示例

```cpp
// ❌ CRITICAL: 违反 RAII
double* data = new double[n];
process(data);
delete[] data;  // 异常时泄漏

// ✅ SECURE: RAII
auto data = std::make_unique<double[]>(n);
process(data.get());
// 自动释放

// ❌ CRITICAL: 缓冲区溢出
void fill(double* data, int n) {
  for (int i = 0; i <= n; ++i)  // Off-by-one!
    data[i] = 0.0;
}

// ✅ SECURE: 边界安全
void fill(std::span<double> data) {
  std::ranges::fill(data, 0.0);
}
```

---

## 5. Hook System

Hook 是基于工具事件的自动化触发器，在 Claude Code 执行工具前后自动运行。

### 5.1 事件生命周期

```
Session Start
    │
    ▼
┌─ PreToolUse ─┐     ┌─ PostToolUse ─┐
│  验证/拦截    │     │  格式化/检查   │
│  tmux 检查    │     │  clang-format  │
│  .md 创建拦截 │     │  语法检查      │
│  压缩建议     │     │  debug 输出警告│
└──────┬───────┘     │  PR URL 提取   │
       │             │  构建分析(async)│
       ▼             └──────┬─────────┘
   Tool 执行                │
       │                    ▼
       └──────────► Stop Hook（每次响应后）
                        │
                        ▼
                   Session End
                   ├─ 持久化状态
                   └─ 评估/学习
```

### 5.2 Hook 详解

#### PreToolUse Hooks（6 个）

**1. 长时间进程 tmux 强制**
```
触发: cmake --build && ./xxx | make && ./xxx | mpirun
动作: 拦截，提示使用 tmux
```

**2. tmux 提醒**
```
触发: cmake --build | make -j | ctest | mpirun | mpiexec | srun
动作: 非 tmux 环境下输出提醒
```

**3. Git push 审查**
```
触发: git push
动作: 提醒先审查变更
```

**4. 文档文件创建拦截**
```
触发: Write .md/.txt (除 README/CLAUDE/AGENTS/CONTRIBUTING)
动作: 拦截，引导使用 README.md
```

**5. 策略压缩建议**
```
触发: Edit 或 Write
动作: 在逻辑断点建议手动压缩
脚本: scripts/hooks/suggest-compact.js
```

#### PostToolUse Hooks（5 个）

**1. PR URL 提取**
```
触发: Bash 中执行 gh pr create
动作: 从输出中提取 PR URL，显示 review 命令
```

**2. 构建完成通知（异步）**
```
触发: cmake --build | make -j | ctest
动作: 后台分析（timeout: 30s, async: true）
```

**3. C++ 自动格式化**
```
触发: Edit .cpp/.hpp/.cc/.h/.cxx/.hxx
动作: clang-format --style=Google -i <file>
安全: 使用 execFileSync（防注入）
```

**4. C++20 语法检查**
```
触发: Edit .cpp/.cc/.cxx
动作: g++ -std=c++20 -Wall -Wextra -fsyntax-only <file>
输出: 前 10 条 error/warning
```

**5. Debug 输出警告**
```
触发: Edit .cpp/.hpp/.cc/.h/.cxx/.hxx
动作: 检测 std::cout / printf / fprintf(stderr)
输出: 警告 + 行号
```

#### 其他 Hooks

| 事件 | 脚本 | 功能 |
|------|------|------|
| PreCompact | pre-compact.js | 压缩前保存状态 |
| SessionStart | session-start.js | 加载上次上下文，检测构建系统 |
| SessionEnd | session-end.js | 持久化 session 状态 |
| SessionEnd | evaluate-session.js | 提取可学习模式 |
| Stop | check-console-log.js | 检查修改文件中的 debug 输出 |

### 5.3 设计特点

- **100% Node.js 实现** — 跨平台（Windows/macOS/Linux）
- **安全执行** — 使用 `execFileSync` 替代 `execSync`（防命令注入）
- **异步支持** — 构建分析 hook 使用 `"async": true` 不阻塞主流程
- **管道数据** — 通过 stdin 接收 JSON（tool_input/tool_output），stdout 返回

---

## 6. Script Architecture

所有脚本采用 Node.js 编写，零外部依赖，确保跨平台兼容。

### 6.1 目录结构

```
scripts/
├── lib/                          # 共享基础库
│   ├── utils.js                  #   文件/路径/Git/进程工具
│   └── build-system.js           #   CMake/Make 检测与编译器选择
├── hooks/                        # Hook 实现
│   ├── session-start.js          #   加载上下文 + 构建系统检测
│   ├── session-end.js            #   持久化 session 状态
│   ├── pre-compact.js            #   压缩前状态保存
│   ├── suggest-compact.js        #   策略压缩建议
│   ├── evaluate-session.js       #   提取学习模式
│   └── check-console-log.js      #   检测 C++ debug 输出
├── ci/                           # CI 校验脚本
│   ├── validate-agents.js        #   校验 agent frontmatter
│   ├── validate-commands.js      #   校验 command 结构
│   ├── validate-hooks.js         #   校验 hooks.json schema
│   ├── validate-rules.js         #   校验 rules 格式
│   └── validate-skills.js        #   校验 skills 格式
├── setup-build-system.js         # 交互式构建系统配置
└── skill-create-output.js        # Skill 生成格式化
```

### 6.2 核心工具库 (scripts/lib/utils.js)

**平台检测：**
```javascript
isWindows    // process.platform === 'win32'
isMacOS      // process.platform === 'darwin'
isLinux      // process.platform === 'linux'
```

**路径工具：**
```javascript
getHomeDir()      // ~/
getClaudeDir()    // ~/.claude
getSessionsDir()  // ~/.claude/sessions
getTempDir()      // 系统临时目录
```

**文件操作（替代 Unix 命令）：**
```javascript
findFiles(dir, pattern, {maxAge, recursive})  // 替代 find
grepFile(filePath, pattern)                   // 替代 grep
replaceInFile(filePath, search, replace)      // 替代 sed
runCommand(cmd, options)                       // 安全执行命令
```

**Git 工具：**
```javascript
isGitRepo()              // 是否在 git 仓库中
getGitRepoName()         // 仓库名称
getGitModifiedFiles(ext) // 获取修改的文件（按扩展名过滤）
```

### 6.3 构建系统检测 (scripts/lib/build-system.js)

检测优先级：

```
1. 环境变量      CLAUDE_BUILD_SYSTEM / CLAUDE_CXX_COMPILER
2. 项目配置      .claude/build-system.json
3. 项目文件      CMakeLists.txt → cmake, Makefile → make
4. 全局配置      ~/.claude/build-system.json
5. 兜底          cmake > make, clang++ > g++
```

输出配置示例：
```json
{
  "buildSystem": "cmake",
  "compiler": "clang++",
  "cCompiler": "clang",
  "generator": "Ninja"
}
```

---

## 7. Context Modes

Context 通过 `contexts/*.md` 定义，为不同工作场景设置 Claude 的行为模式。

| Context | 文件 | 行为特征 |
|---------|------|---------|
| **dev** | contexts/dev.md | 代码优先、working > perfect、原子提交、快速迭代 |
| **review** | contexts/review.md | 批判性分析、安全聚焦、质量门禁、不修改代码 |
| **research** | contexts/research.md | 只读探索、分析与文档、不做任何修改 |

---

## 8. CI/CD Pipeline

### 8.1 主流水线 (.github/workflows/ci.yml)

```
┌─────────────────────────────────────────────┐
│                ci.yml                        │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │  test   │  │ validate │  │ cpp-build │  │
│  │         │  │          │  │           │  │
│  │ Node.js │  │ agents   │  │ g++       │  │
│  │ 18/20/22│  │ commands │  │ clang++   │  │
│  │         │  │ hooks    │  │           │  │
│  │ run-all │  │ rules    │  │ cmake     │  │
│  │ .js     │  │ skills   │  │ ctest     │  │
│  └─────────┘  └──────────┘  └───────────┘  │
│                                             │
│  ┌──────────┐                               │
│  │   lint   │                               │
│  │ markdown │                               │
│  │   lint   │                               │
│  └──────────┘                               │
└─────────────────────────────────────────────┘
```

**Job 矩阵：**

| Job | 矩阵 | 内容 |
|-----|------|------|
| test | Node 18.x / 20.x / 22.x | `node tests/run-all.js` |
| validate | Node 20.x | 5 个 validate-*.js 脚本 |
| cpp-build | g++ / clang++ | CMake configure → build → CTest |
| lint | — | markdownlint 检查所有 .md |

### 8.2 可复用工作流

```
reusable-validate.yml  → 校验脚本（被 ci.yml 调用）
reusable-test.yml      → 测试运行（被 ci.yml 调用）
reusable-release.yml   → 发布流程（被 release.yml 调用）
maintenance.yml        → 定期维护任务
```

---

## 9. Learning System

Continuous Learning v2 是基于 **Instinct（直觉）** 的自适应学习系统。

### 9.1 架构

```
┌──────────────────────────────────────────────────────┐
│                  Learning Pipeline                    │
│                                                      │
│  Session Activity                                    │
│       │                                              │
│       ▼                                              │
│  PreToolUse / PostToolUse Hooks                      │
│       │                                              │
│       ▼                                              │
│  observations.jsonl  (原始观察记录)                    │
│       │                                              │
│       ▼                                              │
│  ┌─────────────┐                                     │
│  │  Observer    │  (Haiku, 后台运行)                  │
│  │  Agent       │                                    │
│  │             │  分析模式：                          │
│  │  - 用户纠正 │  → instinct (confidence: 0.7)       │
│  │  - 错误修复 │  → instinct (confidence: 0.6)       │
│  │  - 重复工作流│  → instinct (confidence: 0.8)       │
│  └──────┬──────┘                                     │
│         ▼                                            │
│  ~/.claude/homunculus/instincts/personal/*.md         │
│         │                                            │
│         ▼  (/evolve 命令)                            │
│  ┌──────────────┐                                    │
│  │   Clustering  │                                   │
│  │   按领域标签   │                                   │
│  │   聚类相关     │                                   │
│  │   instincts   │                                   │
│  └──────┬───────┘                                    │
│         ▼                                            │
│  ~/.claude/homunculus/evolved/                        │
│  ├── agents/*.md     (新 Agent 定义)                  │
│  ├── skills/*.md     (新 Skill 定义)                  │
│  └── commands/*.md   (新 Command 定义)                │
└──────────────────────────────────────────────────────┘
```

### 9.2 Instinct 生命周期

```
创建 (confidence: 0.3-0.5)
  │
  ▼ 被更多观察支持
强化 (confidence: 0.5-0.7)
  │
  ▼ 多次验证
成熟 (confidence: 0.7-0.9)
  │
  ▼ /evolve 聚类
演化为 Skill / Command / Agent
```

### 9.3 CLI 工具

```bash
# Python CLI (scripts/instinct-cli.py)
python instinct-cli.py list              # 列出所有 instincts
python instinct-cli.py show <id>         # 查看详情
python instinct-cli.py export -o out.json # 导出
python instinct-cli.py import in.json    # 导入
python instinct-cli.py evolve            # 聚类演化
```

---

## 10. Workflow Examples

### 10.1 新功能开发完整流程

```
用户: "实现 CG 共轭梯度求解器"

Step 1: /plan (planner agent, Opus)
  ├─ 读取现有代码结构（Read, Grep, Glob）
  ├─ 分析依赖关系
  ├─ 输出分步计划：
  │   1. 定义 ILinearOperator 接口
  │   2. 实现 CGSolver 类
  │   3. 添加预条件子支持
  │   4. 编写单元测试
  │   5. 编写集成测试
  └─ 等待用户确认 ✓

Step 2: /tdd (tdd-guide agent, Sonnet)
  ├─ SCAFFOLD: 写 include/solver/cg_solver.hpp
  │   → PostToolUse: clang-format 自动格式化
  │
  ├─ RED: 写 tests/unit/test_cg_solver.cpp
  │   TEST_F(CGSolverTest, SolvesIdentitySystem)
  │   TEST_F(CGSolverTest, ConvergesWithinMaxIter)
  │   TEST_F(CGSolverTest, ThrowsOnSingularMatrix)
  │   → PostToolUse: clang-format
  │   → 运行: ctest -R test_cg → FAIL ✗
  │
  ├─ GREEN: 写 src/solver/cg_solver.cpp (最小实现)
  │   → PostToolUse: clang-format
  │   → PostToolUse: g++ -fsyntax-only 语法检查
  │   → PostToolUse: 检测 std::cout → 警告（如有）
  │   → 运行: ctest -R test_cg → PASS ✓
  │
  ├─ REFACTOR: 优化内存分配、添加 concepts 约束
  │   → 运行: ctest -R test_cg → PASS ✓
  │
  └─ COVERAGE: lcov 报告 → 85% ✓

Step 3: /code-review (code-reviewer agent, Opus)
  ├─ 读取 git diff
  ├─ 检查项：
  │   ✓ RAII - 无裸 new/delete
  │   ✓ const 正确性 - Apply() 标记 const
  │   ✓ 移动语义 - 大向量按引用传递
  │   ⚠ 性能 - 内循环可考虑 SIMD
  └─ 报告: LOW risk, 1 suggestion

Step 4: /verify
  ├─ Build:    cmake --build build → ✓
  ├─ Test:     ctest --test-dir build → ✓
  ├─ Coverage: lcov → 85% ✓
  └─ Security: 无 hardcoded secrets ✓

Step 5: SessionEnd hooks
  ├─ session-end.js → 保存状态
  └─ evaluate-session.js → 提取模式
      → 新 instinct: "CG solver 使用 concepts 约束 operator 类型"
```

### 10.2 构建错误修复流程

```
用户: 构建失败了

/build-fix (build-error-resolver agent, Sonnet)
  ├─ 执行: cmake --build build 2>&1
  ├─ 解析错误类型：
  │   • CMake 配置错误 → 修复 CMakeLists.txt
  │   • 链接错误 → 检查 target_link_libraries
  │   • 模板实例化 → 添加显式实例化
  │   • Concept 约束失败 → 修复类型约束
  ├─ 增量修复（一次只修一个错误）
  ├─ 重新构建验证
  └─ 重复直到构建成功
```

### 10.3 安全审查流程

```
/code-review → 发现内存操作代码
  ↓ 自动触发
security-reviewer agent (Opus)
  ├─ Phase 1: 自动分析
  │   ├─ ASan:  cmake -DCMAKE_CXX_FLAGS="-fsanitize=address" → ctest
  │   ├─ UBSan: cmake -DCMAKE_CXX_FLAGS="-fsanitize=undefined" → ctest
  │   ├─ TSan:  cmake -DCMAKE_CXX_FLAGS="-fsanitize=thread" → ctest
  │   ├─ clang-tidy: bugprone-*, cert-*, clang-analyzer-security.*
  │   └─ cppcheck: --enable=all
  │
  ├─ Phase 2: 手动审查焦点
  │   ├─ 所有 reinterpret_cast
  │   ├─ 所有裸指针算术
  │   ├─ 所有 std::atomic 使用（memory ordering 正确？）
  │   ├─ 所有文件 I/O（path traversal？）
  │   └─ 线程同步模式
  │
  └─ Phase 3: 报告
      ├─ Risk Level: CRITICAL / HIGH / MEDIUM / LOW
      ├─ CWE 编号
      ├─ 位置: file.cpp:123
      └─ 修复建议
```

---

## 11. Plugin Infrastructure

### 11.1 插件清单

```json
// .claude-plugin/plugin.json
{
  "name": "everything-claude-code",
  "description": "Complete collection of Claude Code configs for C++20 HPC...",
  "skills": ["./skills/", "./commands/"],
  "agents": ["./agents/architect.md", "./agents/tdd-guide.md", ...]
}
```

**关键设计决策：**
- **无 version 字段** → 启用自动更新
- **无 hooks 字段** → Claude Code v2.1+ 自动加载 `hooks/hooks.json`（避免重复检测错误）
- **skills 包含 commands/** → 斜杠命令通过 skill 路径注册

### 11.2 JSON Schema 校验

```
schemas/
├── hooks.schema.json    # hooks.json 格式校验
├── plugin.schema.json   # plugin.json 格式校验
└── package-manager.schema.json  # 构建系统配置校验
```

### 11.3 测试体系

```
tests/
├── lib/
│   ├── utils.test.js          # utils.js 单元测试
│   └── build-system.test.js   # build-system.js 单元测试
├── hooks/
│   └── hooks.test.js          # hooks.json 校验测试
├── integration/
│   └── hooks.test.js          # hooks 集成测试
└── run-all.js                 # 测试入口（69 tests）
```

---

## Summary

| 维度 | 数量 | 说明 |
|------|------|------|
| Agents | 12 | 5 C++20 HPC + 4 通用 + 3 多语言 |
| Skills | 22 | 4 C++20 HPC + 6 跨语言 + 12 多语言 |
| Commands | 23 | 7 开发 + 4 维护 + 6 学习 + 6 高级 |
| Rules | 7 | 安全 / 编码 / 测试 / 模式 / Git / 性能 / Agent |
| Hooks | 13 | 6 PreToolUse + 5 PostToolUse + 2 Session |
| Tests | 69 | lib + hooks + integration |
| CI Jobs | 4 | test + validate + cpp-build + lint |

**核心价值：** 通过 Agent 委派 + Hook 自动化 + Rule 强制 + Skill 知识 + Learning 演化，构建了一个**自增强的 C++20 HPC 开发辅助系统**。它不是一组静态配置，而是一个能从开发者行为中持续学习并进化的活系统。
