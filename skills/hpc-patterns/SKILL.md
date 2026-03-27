---
name: hpc-patterns
description: High-performance computing patterns for C++20 including cache-friendly data structures, SIMD vectorization, memory management, thread parallelism, lock-free data structures, and NUMA-aware allocation.
---

# HPC Patterns for C++20

Domain knowledge for building high-performance computing applications with optimal hardware utilization.

## Cache-Friendly Data Structures

### Structure of Arrays (SoA) vs Array of Structures (AoS)

```cpp
// BAD: Array of Structures (poor cache utilization for position-only access)
struct ParticleAoS {
  double x, y, z;         // position
  double vx, vy, vz;      // velocity
  double fx, fy, fz;      // force
  double mass;
  int type;
  bool active;
};
std::vector<ParticleAoS> particles(N);  // Stride = sizeof(ParticleAoS)

// GOOD: Structure of Arrays (contiguous access per field)
struct ParticlesSoA {
  std::vector<double> x, y, z;
  std::vector<double> vx, vy, vz;
  std::vector<double> fx, fy, fz;
  std::vector<double> mass;
  std::vector<int> type;
  std::vector<bool> active;

  explicit ParticlesSoA(size_t n)
      : x(n), y(n), z(n), vx(n), vy(n), vz(n),
        fx(n), fy(n), fz(n), mass(n), type(n), active(n) {}
};
```

### Cache Line Alignment

```cpp
// Align to cache line boundaries
struct alignas(64) CacheAlignedBlock {
  std::array<double, 8> data;  // 64 bytes = 1 cache line
};

// Padding to avoid false sharing in multithreaded code
struct alignas(64) ThreadLocalCounter {
  std::atomic<int64_t> count{0};
  char padding[64 - sizeof(std::atomic<int64_t>)];  // Fill cache line
};
```

### Tiling for Cache Reuse

```cpp
// Cache-oblivious matrix multiply (blocked)
void MatMulBlocked(std::span<const double> A, std::span<const double> B,
                   std::span<double> C, int N, int block_size = 64) {
  for (int ii = 0; ii < N; ii += block_size) {
    for (int jj = 0; jj < N; jj += block_size) {
      for (int kk = 0; kk < N; kk += block_size) {
        int i_end = std::min(ii + block_size, N);
        int j_end = std::min(jj + block_size, N);
        int k_end = std::min(kk + block_size, N);

        for (int i = ii; i < i_end; ++i) {
          for (int k = kk; k < k_end; ++k) {
            double a_ik = A[i * N + k];
            for (int j = jj; j < j_end; ++j) {
              C[i * N + j] += a_ik * B[k * N + j];
            }
          }
        }
      }
    }
  }
}
```

## SIMD Vectorization

### Compiler Auto-Vectorization Hints

```cpp
// Restrict pointers for no-alias guarantee
void VectorAdd(double* __restrict__ out,
               const double* __restrict__ a,
               const double* __restrict__ b, size_t n) {
  #pragma omp simd
  for (size_t i = 0; i < n; ++i) {
    out[i] = a[i] + b[i];
  }
}

// Aligned access for vectorization
void ScaleVector(double* __restrict__ data, double factor, size_t n) {
  assert(reinterpret_cast<uintptr_t>(data) % 32 == 0);  // AVX alignment
  #pragma omp simd aligned(data: 32)
  for (size_t i = 0; i < n; ++i) {
    data[i] *= factor;
  }
}
```

### Explicit SIMD with Intrinsics (when needed)

```cpp
#include <immintrin.h>

// AVX2 dot product
double DotProductAVX(const double* a, const double* b, size_t n) {
  __m256d sum = _mm256_setzero_pd();
  size_t i = 0;
  for (; i + 4 <= n; i += 4) {
    __m256d va = _mm256_load_pd(a + i);
    __m256d vb = _mm256_load_pd(b + i);
    sum = _mm256_fmadd_pd(va, vb, sum);
  }
  // Horizontal sum
  double result[4];
  _mm256_store_pd(result, sum);
  double total = result[0] + result[1] + result[2] + result[3];
  // Remainder
  for (; i < n; ++i) total += a[i] * b[i];
  return total;
}
```

## Memory Management

### Custom Allocator for Aligned Memory

```cpp
template <typename T, size_t Alignment = 64>
class AlignedAllocator {
public:
  using value_type = T;

  T* allocate(size_t n) {
    void* ptr = std::aligned_alloc(Alignment, n * sizeof(T));
    if (!ptr) throw std::bad_alloc();
    return static_cast<T*>(ptr);
  }

  void deallocate(T* ptr, size_t) noexcept {
    std::free(ptr);
  }
};

// Usage
using AlignedVector = std::vector<double, AlignedAllocator<double, 64>>;
AlignedVector data(1024);  // 64-byte aligned for AVX-512
```

### Memory Pool for Fixed-Size Allocations

```cpp
template <typename T, size_t PoolSize = 4096>
class MemoryPool {
public:
  T* Allocate() {
    if (free_list_) {
      T* ptr = free_list_;
      free_list_ = *reinterpret_cast<T**>(ptr);
      return ptr;
    }
    if (next_ >= PoolSize) throw std::bad_alloc();
    return &pool_[next_++];
  }

  void Deallocate(T* ptr) noexcept {
    *reinterpret_cast<T**>(ptr) = free_list_;
    free_list_ = ptr;
  }

private:
  std::array<T, PoolSize> pool_;
  T* free_list_ = nullptr;
  size_t next_ = 0;
};
```

## Thread Parallelism

### Thread Pool with Work Stealing

```cpp
#include <thread>
#include <future>
#include <queue>

class ThreadPool {
public:
  explicit ThreadPool(size_t num_threads = std::thread::hardware_concurrency()) {
    for (size_t i = 0; i < num_threads; ++i) {
      workers_.emplace_back([this] { WorkerLoop(); });
    }
  }

  ~ThreadPool() {
    {
      std::lock_guard lock(mutex_);
      stop_ = true;
    }
    cv_.notify_all();
    for (auto& w : workers_) w.join();
  }

  template <typename F, typename... Args>
  auto Submit(F&& f, Args&&... args) -> std::future<std::invoke_result_t<F, Args...>> {
    using ReturnType = std::invoke_result_t<F, Args...>;
    auto task = std::make_shared<std::packaged_task<ReturnType()>>(
        std::bind(std::forward<F>(f), std::forward<Args>(args)...));
    auto future = task->get_future();
    {
      std::lock_guard lock(mutex_);
      tasks_.emplace([task] { (*task)(); });
    }
    cv_.notify_one();
    return future;
  }

private:
  void WorkerLoop() {
    while (true) {
      std::function<void()> task;
      {
        std::unique_lock lock(mutex_);
        cv_.wait(lock, [this] { return stop_ || !tasks_.empty(); });
        if (stop_ && tasks_.empty()) return;
        task = std::move(tasks_.front());
        tasks_.pop();
      }
      task();
    }
  }

  std::vector<std::jthread> workers_;
  std::queue<std::function<void()>> tasks_;
  std::mutex mutex_;
  std::condition_variable cv_;
  bool stop_ = false;
};
```

### Parallel For with Chunking

```cpp
template <typename Func>
void ParallelFor(size_t begin, size_t end, Func&& func,
                 size_t chunk_size = 0) {
  size_t n = end - begin;
  size_t num_threads = std::thread::hardware_concurrency();
  if (chunk_size == 0) chunk_size = std::max(size_t{1}, n / num_threads);

  std::vector<std::jthread> threads;
  for (size_t start = begin; start < end; start += chunk_size) {
    size_t stop = std::min(start + chunk_size, end);
    threads.emplace_back([&func, start, stop] {
      for (size_t i = start; i < stop; ++i) {
        func(i);
      }
    });
  }
  // jthreads auto-join on destruction
}

// Usage
ParallelFor(0, N, [&](size_t i) {
  result[i] = ComputeExpensive(data[i]);
});
```

## Lock-Free Data Structures

### Lock-Free Stack (Treiber Stack)

```cpp
template <typename T>
class LockFreeStack {
  struct Node {
    T data;
    Node* next;
  };

public:
  void Push(T value) {
    auto* node = new Node{std::move(value), nullptr};
    node->next = head_.load(std::memory_order_relaxed);
    while (!head_.compare_exchange_weak(node->next, node,
               std::memory_order_release, std::memory_order_relaxed)) {}
  }

  std::optional<T> Pop() {
    Node* old_head = head_.load(std::memory_order_relaxed);
    while (old_head &&
           !head_.compare_exchange_weak(old_head, old_head->next,
               std::memory_order_acquire, std::memory_order_relaxed)) {}
    if (!old_head) return std::nullopt;
    T value = std::move(old_head->data);
    delete old_head;  // Note: real impl needs hazard pointers or epoch GC
    return value;
  }

private:
  std::atomic<Node*> head_{nullptr};
};
```

## NUMA-Aware Allocation

### First-Touch Policy

```cpp
// Initialize data on the NUMA node where it will be accessed
void InitializeParallel(std::span<double> data, size_t num_threads) {
  size_t chunk = data.size() / num_threads;

  std::vector<std::jthread> threads;
  for (size_t t = 0; t < num_threads; ++t) {
    size_t start = t * chunk;
    size_t end = (t == num_threads - 1) ? data.size() : start + chunk;
    threads.emplace_back([&data, start, end] {
      // First-touch: OS allocates pages on this thread's NUMA node
      for (size_t i = start; i < end; ++i) {
        data[i] = 0.0;
      }
    });
  }
}
```

### NUMA-Local Data Partitioning

```cpp
#ifdef __linux__
#include <numa.h>

class NumaPartition {
public:
  explicit NumaPartition(size_t total_elements) {
    int num_nodes = numa_num_configured_nodes();
    size_t per_node = (total_elements + num_nodes - 1) / num_nodes;

    for (int node = 0; node < num_nodes; ++node) {
      void* mem = numa_alloc_onnode(per_node * sizeof(double), node);
      if (!mem) throw std::bad_alloc();
      partitions_.push_back({static_cast<double*>(mem), per_node});
    }
  }

  ~NumaPartition() {
    for (auto& [ptr, size] : partitions_) {
      numa_free(ptr, size * sizeof(double));
    }
  }

  std::span<double> GetPartition(int node) {
    return {partitions_[node].first, partitions_[node].second};
  }

private:
  std::vector<std::pair<double*, size_t>> partitions_;
};
#endif
```

## Performance Measurement

```cpp
#include <chrono>

class Timer {
public:
  void Start() { start_ = std::chrono::high_resolution_clock::now(); }

  double ElapsedMs() const {
    auto now = std::chrono::high_resolution_clock::now();
    return std::chrono::duration<double, std::milli>(now - start_).count();
  }

  double ElapsedSeconds() const { return ElapsedMs() / 1000.0; }

private:
  std::chrono::high_resolution_clock::time_point start_;
};

// FLOPS measurement
void BenchmarkMatVec(size_t N, int repeats) {
  Timer timer;
  timer.Start();
  for (int r = 0; r < repeats; ++r) {
    MatVec(A, x, y, N);  // 2*N*N FLOPs
  }
  double elapsed = timer.ElapsedSeconds();
  double gflops = (2.0 * N * N * repeats) / (elapsed * 1e9);
  // Report: N, elapsed, gflops
}
```

## Google Benchmark Integration

```cpp
#include <benchmark/benchmark.h>

// Basic benchmark
static void BM_VectorAdd(benchmark::State& state) {
  const size_t N = state.range(0);
  std::vector<double> a(N, 1.0), b(N, 2.0), c(N);

  for (auto _ : state) {
    for (size_t i = 0; i < N; ++i) c[i] = a[i] + b[i];
    benchmark::DoNotOptimize(c.data());
    benchmark::ClobberMemory();
  }
  state.SetBytesProcessed(state.iterations() * N * 3 * sizeof(double));
  state.SetItemsProcessed(state.iterations() * N);
  state.counters["FLOPS"] = benchmark::Counter(
      state.iterations() * N, benchmark::Counter::kIsRate);
}

BENCHMARK(BM_VectorAdd)
    ->RangeMultiplier(4)->Range(1<<10, 1<<24)
    ->Unit(benchmark::kMicrosecond);

// Compare implementations
static void BM_MatMulNaive(benchmark::State& state) { /* ... */ }
static void BM_MatMulBlocked(benchmark::State& state) { /* ... */ }

BENCHMARK(BM_MatMulNaive)->DenseRange(64, 512, 64);
BENCHMARK(BM_MatMulBlocked)->DenseRange(64, 512, 64);
```

```cmake
# CMake integration
find_package(benchmark REQUIRED)
add_executable(bench_hpc benchmarks/bench_hpc.cpp)
target_link_libraries(bench_hpc benchmark::benchmark project_math)
```

## Profiling with perf & Flamegraph

```bash
# CPU profiling
perf record -g --call-graph dwarf -F 99 ./build/release/my_app
perf report --hierarchy --sort comm,dso,sym

# Generate flamegraph
perf script | stackcollapse-perf.pl | flamegraph.pl > cpu.svg

# Cache miss analysis
perf stat -e cache-references,cache-misses,L1-dcache-load-misses \
  ./build/release/my_app

# Branch prediction
perf stat -e branch-instructions,branch-misses ./build/release/my_app
```

### Memory Profiling

```bash
# Heap profiling with heaptrack
heaptrack ./build/debug/my_app
heaptrack_gui heaptrack.my_app.*.gz

# Valgrind cachegrind (cache behavior)
valgrind --tool=cachegrind ./build/debug/my_app
cg_annotate cachegrind.out.<pid>
```

## MPI Parallel Patterns

### Basic MPI with RAII Wrapper

```cpp
#include <mpi.h>
#include <span>

class MPIGuard {
public:
  MPIGuard(int& argc, char**& argv) { MPI_Init(&argc, &argv); }
  ~MPIGuard() { MPI_Finalize(); }
  MPIGuard(const MPIGuard&) = delete;
  MPIGuard& operator=(const MPIGuard&) = delete;
};

struct MPIContext {
  int rank, size;
  MPIContext() {
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);
  }
  [[nodiscard]] bool is_root() const { return rank == 0; }
};
```

### Domain Decomposition

```cpp
// Distribute N elements across ranks
struct Partition {
  size_t local_start, local_count;

  static Partition Compute(size_t N, int rank, int num_ranks) {
    size_t base = N / num_ranks;
    size_t remainder = N % num_ranks;
    size_t start = rank * base + std::min<size_t>(rank, remainder);
    size_t count = base + (static_cast<size_t>(rank) < remainder ? 1 : 0);
    return {start, count};
  }
};

// Scatter-Compute-Gather pattern
void ParallelSolve(std::span<double> global_data, const MPIContext& ctx) {
  auto [start, count] = Partition::Compute(global_data.size(), ctx.rank, ctx.size);
  std::vector<double> local(count);

  MPI_Scatterv(global_data.data(), /* ... */);
  // Local computation
  for (auto& v : local) v = Compute(v);
  MPI_Gatherv(local.data(), /* ... */);
}
```

### MPI + OpenMP Hybrid

```cpp
// Thread-level parallelism within MPI rank
void HybridCompute(std::span<double> local_data) {
  #pragma omp parallel for schedule(dynamic, 64)
  for (size_t i = 0; i < local_data.size(); ++i) {
    local_data[i] = ExpensiveOp(local_data[i]);
  }
  // MPI communication between ranks (outside OpenMP region)
  MPI_Allreduce(MPI_IN_PLACE, local_data.data(),
                local_data.size(), MPI_DOUBLE, MPI_SUM, MPI_COMM_WORLD);
}
```

### Testing MPI Code

```bash
# Run MPI tests with CTest
# CMakeLists.txt:
#   add_test(NAME mpi_test_4 COMMAND mpirun -np 4 $<TARGET_FILE:test_mpi>)
#   set_tests_properties(mpi_test_4 PROPERTIES PROCESSORS 4)

ctest --test-dir build -R mpi_ --output-on-failure
```

```cpp
// Google Test with MPI
class MPITest : public ::testing::Test {
protected:
  MPIContext ctx_;
};

TEST_F(MPITest, PartitionCoversAll) {
  const size_t N = 1000;
  auto [start, count] = Partition::Compute(N, ctx_.rank, ctx_.size);

  size_t total = 0;
  MPI_Allreduce(&count, &total, 1, MPI_UNSIGNED_LONG, MPI_SUM, MPI_COMM_WORLD);
  EXPECT_EQ(total, N);
}
```

## GPU Offloading Patterns (CUDA/HIP)

### Unified Memory with RAII

```cpp
template <typename T>
class DeviceVector {
public:
  explicit DeviceVector(size_t n) : size_(n) {
    cudaMallocManaged(&data_, n * sizeof(T));
  }
  ~DeviceVector() { cudaFree(data_); }

  T* data() { return data_; }
  size_t size() const { return size_; }

  DeviceVector(const DeviceVector&) = delete;
  DeviceVector& operator=(const DeviceVector&) = delete;
  DeviceVector(DeviceVector&& o) noexcept : data_(o.data_), size_(o.size_) {
    o.data_ = nullptr; o.size_ = 0;
  }

private:
  T* data_ = nullptr;
  size_t size_ = 0;
};
```

---

**Key Principles**:
1. Measure before optimizing — use perf/flamegraph, not intuition
2. Profile to find bottlenecks — cache misses often dominate
3. Optimize data layout first (cache/SoA)
4. Then parallelism (threads/SIMD/MPI/GPU)
5. Benchmark with Google Benchmark for regression detection
6. Verify correctness after optimization (use sanitizers)
