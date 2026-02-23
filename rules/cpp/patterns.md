# Common C++ Patterns

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

## Repository Interface (Abstract Base Class)

```cpp
template <typename T>
class IRepository {
public:
  virtual ~IRepository() = default;

  virtual std::vector<T> FindAll() const = 0;
  virtual std::optional<T> FindById(int64_t id) const = 0;
  virtual T Create(const T& entity) = 0;
  virtual void Update(int64_t id, const T& entity) = 0;
  virtual void Delete(int64_t id) = 0;
};

class ParticleRepository : public IRepository<Particle> {
public:
  explicit ParticleRepository(std::shared_ptr<Database> db)
      : db_(std::move(db)) {}

  std::vector<Particle> FindAll() const override {
    return db_->Query<Particle>("SELECT * FROM particles");
  }

  // ... other implementations
private:
  std::shared_ptr<Database> db_;
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
