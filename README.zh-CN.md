**语言:** [English](README.md) | 简体中文

# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![CI](https://img.shields.io/github/actions/workflow/status/ysyecust/everything-claude-code/ci.yml?label=CI)](https://github.com/ysyecust/everything-claude-code/actions)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![C++](https://img.shields.io/badge/-C%2B%2B20-00599C?logo=c%2B%2B&logoColor=white)
![CMake](https://img.shields.io/badge/-CMake-064F8C?logo=cmake&logoColor=white)

**面向 C++20 高性能计算开发的 Claude Code 完整配置集合。**

生产就绪的 agents、skills、hooks、commands、rules 和配置，覆盖现代 C++、CMake、Google Test、sanitizers 等方方面面。Fork 自 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code)，并适配 C++20 HPC 工作流。

---

## 目录结构

本仓库是一个 **Claude Code 插件** —— 可以直接安装，也可以手动复制组件。

```
everything-claude-code/
|-- .claude-plugin/    # 插件和市场清单
|-- .github/workflows/ # CI/CD 流水线
|-- agents/            # 专业子代理（12 个）
|   |-- C++20 HPC: tdd-guide, code-reviewer, security-reviewer,
|   |     build-error-resolver, integration-test-runner
|   |-- 通用: planner, architect, refactor-cleaner, doc-updater
|   |-- 多语言: database-reviewer, go-reviewer, go-build-resolver
|
|-- skills/            # 工作流定义和领域知识（22 个）
|   |-- C++20 HPC: coding-standards, hpc-patterns, numerical-patterns, tdd-workflow
|   |-- 跨语言: continuous-learning-v2, iterative-retrieval, strategic-compact,
|   |     security-review, eval-harness, verification-loop
|   |-- 多语言: golang-*, springboot-*, java-*, jpa-*, postgres-*, clickhouse-io
|
|-- commands/          # 斜杠命令（23 个）
|   |-- C++20: /tdd, /plan, /integration-test, /code-review, /build-fix, /test-coverage
|   |-- 学习: /learn, /skill-create, /instinct-status, /instinct-import, /instinct-export, /evolve
|   |-- 工作流: /orchestrate, /verify, /checkpoint, /eval, /setup-pm, /refactor-clean
|
|-- rules/             # 始终遵循的准则（7 个）
|-- hooks/             # 基于触发器的自动化（clang-format, 语法检查, debug 检测等）
|-- schemas/           # JSON 校验 schema（hooks, plugin）
|-- scripts/           # 跨平台 Node.js 脚本（lib, hooks, ci）
|-- tests/             # 测试套件（lib, hooks, integration）
|-- contexts/          # 动态系统提示上下文（dev, review, research）
```

---

## 指南

- **[快速上手指南](the-shortform-guide.md)** — 快速掌握 C++20 HPC 模式
- **[完整深入指南](the-longform-guide.md)** — 每个组件和工作流的详细说明

---

## 构建系统检测

插件自动检测首选的构建系统（CMake/Make）和编译器（GCC/Clang），优先级如下：

1. **环境变量**: `CLAUDE_BUILD_SYSTEM` / `CLAUDE_CXX_COMPILER`
2. **项目配置**: `.claude/build-system.json`
3. **项目文件**: CMakeLists.txt 或 Makefile 检测
4. **全局配置**: `~/.claude/build-system.json`
5. **兜底**: 第一个可用的（cmake > make, clang > gcc）

```bash
# 通过环境变量设置
export CLAUDE_BUILD_SYSTEM=cmake
export CLAUDE_CXX_COMPILER=clang++

# 通过设置脚本
node scripts/setup-build-system.js --global cmake
```

---

## 生态工具

### Skill Creator

两种方式从仓库生成 Claude Code skill：

**方式 A：本地分析（内置）**

```bash
/skill-create                    # 分析当前仓库
/skill-create --instincts        # 同时生成 instincts
```

**方式 B：GitHub App（高级）**

适用于 10k+ commit、自动 PR、团队共享：[安装 GitHub App](https://github.com/apps/skill-creator)

### Continuous Learning v2

基于 instinct 的自学习系统，自动学习你的编码模式：

```bash
/instinct-status        # 查看已学习的 instincts 和置信度
/instinct-import <file> # 从他人导入 instincts
/instinct-export        # 导出 instincts 用于分享
/evolve                 # 将相关 instincts 聚类为 skills
```

详见 `skills/continuous-learning-v2/`。

---

## 系统要求

### Claude Code CLI 版本

**最低版本: v2.1.0 或更高**

本插件要求 Claude Code CLI v2.1.0+，因为插件系统对 hooks 的处理方式有所变化。

```bash
claude --version
```

### 重要：Hooks 自动加载行为

> **贡献者注意：** 不要在 `.claude-plugin/plugin.json` 中添加 `"hooks"` 字段。这一点由回归测试强制执行。

Claude Code v2.1+ 会**自动加载**已安装插件中的 `hooks/hooks.json`。显式声明会导致重复检测错误。

---

## 安装

### 方式一：作为插件安装（推荐）

```bash
# 添加此仓库为市场
/plugin marketplace add ysyecust/everything-claude-code

# 安装插件
/plugin install everything-claude-code@everything-claude-code
```

或直接添加到 `~/.claude/settings.json`：

```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "ysyecust/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

> **注意：** Claude Code 插件系统不支持通过插件分发 `rules`。需手动安装：
>
> ```bash
> git clone https://github.com/ysyecust/everything-claude-code.git
>
> # 用户级规则（应用于所有项目）
> cp -r everything-claude-code/rules/* ~/.claude/rules/
>
> # 项目级规则（仅应用于当前项目）
> mkdir -p .claude/rules
> cp -r everything-claude-code/rules/* .claude/rules/
> ```

### 方式二：手动安装

```bash
git clone https://github.com/ysyecust/everything-claude-code.git

cp everything-claude-code/agents/*.md ~/.claude/agents/
cp everything-claude-code/rules/*.md ~/.claude/rules/
cp everything-claude-code/commands/*.md ~/.claude/commands/
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

---

## 核心概念

### Agents（子代理）

**C++20 HPC 专用：**

| Agent | 功能 |
|-------|------|
| **tdd-guide** | C++20 TDD（Google Test/Mock） |
| **build-error-resolver** | CMake、链接器、模板错误 |
| **code-reviewer** | 内存安全、RAII、性能审查 |
| **security-reviewer** | ASan/UBSan/TSan/MSan 分析 |
| **integration-test-runner** | CTest 标签、MPI 测试 |

**通用：**

| Agent | 功能 |
|-------|------|
| **planner** | 功能实现规划 |
| **architect** | 系统设计决策 |
| **refactor-cleaner** | 死代码清理 |
| **doc-updater** | 文档同步 |
| **database-reviewer** | SQL/数据库审查 |
| **go-reviewer** / **go-build-resolver** | Go 代码审查和构建修复 |

### Skills（技能）

**C++20 HPC 领域知识：**

- **coding-standards** — 命名、concepts、ranges、constexpr
- **hpc-patterns** — 缓存友好数据、SIMD、线程、NUMA
- **numerical-patterns** — 稀疏矩阵、CG/GMRES、HPC I/O
- **tdd-workflow** — Google Test 参数化测试、CMake 集成

**跨语言（学习与工作流）：**

- **continuous-learning-v2** — 基于 instinct 的自学习系统
- **iterative-retrieval** — 子代理渐进式上下文检索
- **strategic-compact** — 手动压缩建议
- **eval-harness** — 验证循环评估
- **security-review** — 安全检查清单 + 云基础设施安全

**多语言（来自上游）：**

- **golang-patterns** / **golang-testing** — Go 惯用模式和测试
- **springboot-patterns** / **springboot-tdd** / **springboot-security** — Spring Boot
- **jpa-patterns** / **java-coding-standards** — Java/JPA
- **postgres-patterns** — PostgreSQL 优化
- **clickhouse-io** — ClickHouse 分析

### Hooks（钩子）

钩子在工具事件上触发：

```json
{
  "matcher": "tool == \"Edit\" && tool_input.file_path matches \"\\\\.(cpp|hpp|cc|h)$\"",
  "hooks": [{
    "type": "command",
    "command": "clang-format --style=Google -i \"$file_path\""
  }]
}
```

### Rules（规则）

C++20 始终遵循的准则：

- **security.md** — 缓冲区溢出、use-after-free、CWE Top 25
- **coding-style.md** — RAII、const 正确性、移动语义
- **testing.md** — Google Test、80% 覆盖率、TDD 工作流
- **patterns.md** — Result 类型、CRTP、Builder 模式

---

## 运行测试

```bash
# 运行所有测试
node tests/run-all.js

# 运行单个测试
node tests/lib/utils.test.js
node tests/lib/build-system.test.js
node tests/hooks/hooks.test.js

# 运行 CI 校验脚本
node scripts/ci/validate-agents.js
node scripts/ci/validate-commands.js
node scripts/ci/validate-hooks.js
node scripts/ci/validate-rules.js
node scripts/ci/validate-skills.js
```

---

## 涵盖的 C++20 特性

- **Concepts** — 类型约束和要求
- **Ranges** — 可组合算法和视图
- **std::span** — 非拥有连续视图
- **std::expected** — 无异常错误处理
- **constexpr/consteval** — 编译期计算
- **结构化绑定** — 分解声明
- **三路比较** — 太空船运算符

---

## HPC 模式

- 缓存友好数据结构（SoA/AoS）
- SIMD 向量化提示
- 线程池和无锁容器
- NUMA 感知内存分配
- MPI 通信模式
- HDF5 和二进制 I/O

---

## 贡献

**欢迎并鼓励贡献。**

详见 [CONTRIBUTING.md](CONTRIBUTING.md)。

### 贡献方向

- 更多 HPC 模式（GPU offload、异构计算）
- 新求解器算法（多重网格、区域分解）
- 构建系统集成（Ninja、Meson）
- 性能分析代理（perf、vtune、gprof）
- 更多 sanitizer 工作流

---

## 重要提醒

### 上下文窗口管理

**关键：** 不要同时启用所有 MCP。200k 上下文窗口在启用过多工具后可能缩减到 70k。

经验法则：
- 配置 20-30 个 MCP
- 每个项目启用不超过 10 个
- 活跃工具不超过 80 个

---

## 上游

本仓库是 [affaan-m/everything-claude-code](https://github.com/affaan-m/everything-claude-code) 的 C++20 HPC 适配 fork。我们定期与上游同步并适配新组件。

[![Star History Chart](https://api.star-history.com/svg?repos=affaan-m/everything-claude-code&type=Date)](https://star-history.com/#affaan-m/everything-claude-code&Date)

---

## 许可证

MIT — 自由使用，按需修改，欢迎贡献回馈。
