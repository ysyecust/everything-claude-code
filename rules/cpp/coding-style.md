# C++20 Coding Style

## RAII (CRITICAL)

ALWAYS use RAII for resource management. NEVER manually manage resources:

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
// WRONG: Unnecessary copy
std::vector<double> compute() {
  std::vector<double> result(1000000);
  // ... fill result
  return result;  // OK with NRVO, but be explicit when needed
}

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

### Naming Conventions (Google C++ Style)

```cpp
// Types: PascalCase
class ParticleSystem;
struct SimConfig;
enum class SolverType { kJacobi, kGaussSeidel, kMultigrid };

// Functions: PascalCase
void ComputeGradient();
double CalculateNorm();

// Variables: snake_case
int particle_count;
double time_step;

// Constants: kPascalCase
constexpr int kMaxIterations = 1000;
constexpr double kTolerance = 1e-12;

// Member variables: trailing underscore
class Solver {
  int max_iter_;
  double tolerance_;
};

// Namespaces: snake_case
namespace hpc::solver { }

// Files: snake_case
// particle_system.hpp / particle_system.cpp
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

## Code Quality Checklist

Before marking work complete:
- [ ] Code is readable and well-named (Google C++ Style)
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
