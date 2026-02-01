# Everything Claude Code

[![Stars](https://img.shields.io/github/stars/affaan-m/everything-claude-code?style=flat)](https://github.com/affaan-m/everything-claude-code/stargazers)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
![C++](https://img.shields.io/badge/-C%2B%2B20-00599C?logo=c%2B%2B&logoColor=white)
![CMake](https://img.shields.io/badge/-CMake-064F8C?logo=cmake&logoColor=white)

**面向 C++20 高性能计算开发的 Claude Code 完整配置集合。**

生产就绪的 agents、skills、hooks、commands、rules 和配置，覆盖现代 C++、CMake、Google Test、sanitizers 等方方面面。

---

## 目录结构

本仓库是一个 **Claude Code 插件** —— 可以直接安装，也可以手动复制组件。

```
everything-claude-code/
|-- .claude-plugin/   # 插件和市场清单
|-- agents/           # 专业子代理（planner, tdd-guide, code-reviewer 等）
|-- skills/           # 工作流定义和领域知识（C++20 编码标准, HPC 模式等）
|-- commands/         # 斜杠命令（/tdd, /plan, /code-review 等）
|-- rules/            # 始终遵循的准则（安全, 编码风格, 测试等）
|-- hooks/            # 基于触发器的自动化（clang-format, 语法检查等）
|-- scripts/          # 跨平台 Node.js 脚本
|-- tests/            # 测试套件
|-- contexts/         # 动态系统提示上下文
```

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

## 安装

### 方式一：作为插件安装（推荐）

```bash
# 添加此仓库为市场
/plugin marketplace add affaan-m/everything-claude-code

# 安装插件
/plugin install everything-claude-code@everything-claude-code
```

### 方式二：手动安装

```bash
# 克隆仓库
git clone https://github.com/affaan-m/everything-claude-code.git

# 复制 agents
cp everything-claude-code/agents/*.md ~/.claude/agents/

# 复制 rules
cp everything-claude-code/rules/*.md ~/.claude/rules/

# 复制 commands
cp everything-claude-code/commands/*.md ~/.claude/commands/

# 复制 skills
cp -r everything-claude-code/skills/* ~/.claude/skills/
```

---

## 核心概念

### Agents（子代理）

子代理处理有限范围的委托任务：

| Agent | 功能 |
|-------|------|
| **tdd-guide** | C++20 TDD（Google Test/Mock） |
| **build-error-resolver** | CMake、链接器、模板错误 |
| **code-reviewer** | 内存安全、RAII、性能审查 |
| **security-reviewer** | ASan/UBSan/TSan/MSan 分析 |
| **integration-test-runner** | CTest 标签、MPI 测试 |

### Skills（技能）

C++20 HPC 领域知识：

- **coding-standards** — 命名、concepts、ranges、constexpr
- **hpc-patterns** — 缓存友好数据、SIMD、线程、NUMA
- **numerical-patterns** — 稀疏矩阵、CG/GMRES、HPC I/O
- **tdd-workflow** — Google Test 参数化测试、CMake 集成
- **continuous-learning-v2** — 基于 instinct 的自学习系统

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

## 许可证

MIT — 自由使用，按需修改，欢迎贡献回馈。
