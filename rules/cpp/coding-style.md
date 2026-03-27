---
paths:
  - "**/*.cpp"
  - "**/*.hpp"
  - "**/*.cc"
  - "**/*.hh"
  - "**/*.cxx"
  - "**/*.h"
  - "**/CMakeLists.txt"
---
# C++ Coding Style

> This file extends [common/coding-style.md](../common/coding-style.md) with C++ specific content.

## Modern C++ (C++17/20/23)

- Prefer **modern C++ features** over C-style constructs
- Use `auto` when the type is obvious from context
- Use `constexpr` for compile-time constants
- Use structured bindings: `auto [key, value] = map_entry;`

## Resource Management

- **RAII everywhere** — no manual `new`/`delete`
- Use `std::unique_ptr` for exclusive ownership
- Use `std::shared_ptr` only when shared ownership is truly needed
- Use `std::make_unique` / `std::make_shared` over raw `new`

### RAII Examples (CRITICAL)

```cpp
// WRONG: Manual resource management
void process() {
  auto* buf = new char[1024];
  // ... if exception thrown, memory leaks
  delete[] buf;
}

// CORRECT: RAII
void process() {
  auto buf = std::make_unique<char[]>(1024);
  // Automatically freed on scope exit, even on exceptions
}
```

## Const Correctness (CRITICAL)

ALWAYS use `const` wherever possible:

```cpp
// WRONG: Mutable where not needed
std::string format_name(std::string name) {
  return "[" + name + "]";
}

// CORRECT: Const correctness
std::string format_name(const std::string& name) {
  return "[" + name + "]";
}
```

## Move Semantics

Use move semantics to avoid unnecessary copies:

```cpp
// CORRECT: Enable move for large objects
class Mesh {
public:
  Mesh(Mesh&& other) noexcept = default;
  Mesh& operator=(Mesh&& other) noexcept = default;

  // Delete copy for expensive resources
  Mesh(const Mesh&) = delete;
  Mesh& operator=(const Mesh&) = delete;
};
```

## C++20 Concepts

Use concepts for generic code constraints:

```cpp
// WRONG: Unconstrained template
template <typename T>
T add(T a, T b) { return a + b; }

// CORRECT: Constrained with concepts
template <std::floating_point T>
T add(T a, T b) { return a + b; }

// Custom concept
template <typename T>
concept Numeric = std::integral<T> || std::floating_point<T>;

template <Numeric T>
T clamp(T value, T lo, T hi) {
  return std::max(lo, std::min(value, hi));
}
```

## C++20 Ranges

Prefer ranges over raw loops:

```cpp
// WRONG: Raw loop
std::vector<int> result;
for (const auto& x : data) {
  if (x > 0) {
    result.push_back(x * 2);
  }
}

// CORRECT: Ranges
auto result = data
  | std::views::filter([](int x) { return x > 0; })
  | std::views::transform([](int x) { return x * 2; })
  | std::ranges::to<std::vector>();
```

## Naming Conventions

- Types/Classes: `PascalCase`
- Functions/Methods: `snake_case` or `camelCase` (follow project convention)
- Constants: `kPascalCase` or `UPPER_SNAKE_CASE`
- Namespaces: `lowercase`
- Member variables: `snake_case_` (trailing underscore) or `m_` prefix

## File Organization

MANY SMALL FILES > FEW LARGE FILES:
- High cohesion, low coupling
- 200-500 lines typical, 1000 max
- One class per header/source pair
- Organize by feature/domain, not by type

### Project Structure

```
project/
├── CMakeLists.txt
├── include/project/       # Public headers
│   ├── core/
│   ├── solver/
│   └── io/
├── src/                   # Implementation
│   ├── core/
│   ├── solver/
│   └── io/
├── tests/                 # Google Test files
│   ├── unit/
│   └── integration/
└── benchmarks/            # Performance benchmarks
```

## Error Handling

Use exceptions for exceptional conditions, error codes for expected failures:

```cpp
// For recoverable errors: use expected/optional
std::expected<Config, std::string> LoadConfig(const std::filesystem::path& path) {
  if (!std::filesystem::exists(path)) {
    return std::unexpected("Config file not found: " + path.string());
  }
  // ...
}

// For programming errors: use assertions
void ProcessChunk(std::span<const double> data, int chunk_id) {
  assert(!data.empty() && "ProcessChunk: data must not be empty");
  assert(chunk_id >= 0 && "ProcessChunk: invalid chunk_id");
}
```

## Formatting

- Use **clang-format** — no style debates
- Run `clang-format -i <file>` before committing

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named
- [ ] Functions are small (<50 lines)
- [ ] Files are focused (<1000 lines)
- [ ] No deep nesting (>4 levels)
- [ ] RAII used for all resources
- [ ] Const correctness enforced
- [ ] No raw `new`/`delete` (use smart pointers)
- [ ] No `std::cout`/`printf` debug statements
- [ ] No hardcoded magic numbers
- [ ] Move semantics used for expensive objects
- [ ] Concepts used for generic constraints
- [ ] `noexcept` specified where appropriate
- [ ] `[[nodiscard]]` on functions with important return values

## Reference

See skill: `cpp-coding-standards` for comprehensive C++ coding standards and guidelines.
