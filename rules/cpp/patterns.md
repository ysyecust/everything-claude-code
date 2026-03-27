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
# C++ Patterns

> This file extends [common/patterns.md](../common/patterns.md) with C++ specific content.

## RAII (Resource Acquisition Is Initialization)

Tie resource lifetime to object lifetime:

```cpp
class FileHandle {
public:
    explicit FileHandle(const std::string& path) : file_(std::fopen(path.c_str(), "r")) {}
    ~FileHandle() { if (file_) std::fclose(file_); }
    FileHandle(const FileHandle&) = delete;
    FileHandle& operator=(const FileHandle&) = delete;
private:
    std::FILE* file_;
};
```

## Rule of Five/Zero

- **Rule of Zero**: Prefer classes that need no custom destructor, copy/move constructors, or assignments
- **Rule of Five**: If you define any of destructor/copy-ctor/copy-assign/move-ctor/move-assign, define all five

## Value Semantics

- Pass small/trivial types by value
- Pass large types by `const&`
- Return by value (rely on RVO/NRVO)
- Use move semantics for sink parameters

## Result Type (Expected)

```cpp
#include <expected>
#include <string>

template <typename T>
using Result = std::expected<T, std::string>;

Result<Config> LoadConfig(const std::filesystem::path& path) {
  if (!std::filesystem::exists(path)) {
    return std::unexpected("File not found: " + path.string());
  }
  // ... parse and return Config
  return Config{/* ... */};
}

// Usage
auto config = LoadConfig("settings.toml");
if (!config) {
  std::cerr << "Error: " << config.error() << "\n";
  return 1;
}
// Use *config safely
```

## CRTP (Curiously Recurring Template Pattern)

```cpp
template <typename Derived>
class SolverBase {
public:
  void Solve(std::span<double> x, std::span<const double> b) {
    static_cast<Derived*>(this)->PreProcess(x, b);
    static_cast<Derived*>(this)->Iterate(x, b);
    static_cast<Derived*>(this)->PostProcess(x);
  }

  // Default implementations
  void PreProcess(std::span<double>, std::span<const double>) {}
  void PostProcess(std::span<double>) {}
};

class JacobiSolver : public SolverBase<JacobiSolver> {
public:
  void Iterate(std::span<double> x, std::span<const double> b) {
    // Jacobi-specific iteration
  }
};
```

## Type-Safe Builder Pattern

```cpp
class SimConfig {
public:
  class Builder {
  public:
    Builder& SetTimeStep(double dt) { config_.dt_ = dt; return *this; }
    Builder& SetMaxIter(int n) { config_.max_iter_ = n; return *this; }
    Builder& SetTolerance(double tol) { config_.tol_ = tol; return *this; }
    Builder& SetOutputDir(std::filesystem::path dir) {
      config_.output_dir_ = std::move(dir);
      return *this;
    }

    [[nodiscard]] SimConfig Build() const {
      assert(config_.dt_ > 0 && "Time step must be positive");
      return config_;
    }

  private:
    SimConfig config_;
  };

  double TimeStep() const { return dt_; }
  int MaxIter() const { return max_iter_; }

private:
  double dt_ = 0.01;
  int max_iter_ = 1000;
  double tol_ = 1e-6;
  std::filesystem::path output_dir_ = "./output";
};

// Usage
auto config = SimConfig::Builder()
    .SetTimeStep(0.001)
    .SetMaxIter(5000)
    .SetTolerance(1e-10)
    .Build();
```

## Strategy Pattern with std::function

```cpp
using Preconditioner = std::function<void(std::span<double>, std::span<const double>)>;

class ConjugateGradient {
public:
  explicit ConjugateGradient(Preconditioner precond = nullptr)
      : precond_(std::move(precond)) {}

  void Solve(std::span<double> x, std::span<const double> b) {
    // ... CG iteration
    if (precond_) {
      precond_(z, r);  // Apply preconditioner
    }
  }

private:
  Preconditioner precond_;
};

// Usage
auto solver = ConjugateGradient([](std::span<double> z, std::span<const double> r) {
  // Jacobi preconditioner
  for (size_t i = 0; i < z.size(); ++i) {
    z[i] = r[i] / diagonal[i];
  }
});
```

## Error Handling

- Use exceptions for exceptional conditions
- Use `std::optional` for values that may not exist
- Use `std::expected` (C++23) or result types for expected failures

## Skeleton Projects

When implementing new functionality:
1. Search for battle-tested skeleton projects (CMake templates, HPC frameworks)
2. Use parallel agents to evaluate options:
   - Security assessment (memory safety, sanitizers)
   - Performance analysis (cache, vectorization)
   - Scalability evaluation (MPI, threading model)
   - Build system compatibility
3. Clone best match as foundation
4. Iterate within proven structure

## Reference

See skill: `cpp-coding-standards` for comprehensive C++ patterns and anti-patterns.
