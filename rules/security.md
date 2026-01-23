# C++ Security Guidelines

## Mandatory Security Checks

Before ANY commit:
- [ ] No buffer overflows (bounds-checked access)
- [ ] No use-after-free (RAII, smart pointers)
- [ ] No data races (proper synchronization)
- [ ] No integer overflows (checked arithmetic)
- [ ] No format string vulnerabilities
- [ ] No uninitialized memory reads
- [ ] No null pointer dereferences
- [ ] Error messages don't leak sensitive paths/data

## Memory Safety (CRITICAL)

```cpp
// NEVER: Raw pointer ownership
char* buf = new char[size];
// ... if exception, memory leaks
delete[] buf;

// ALWAYS: RAII / Smart pointers
auto buf = std::make_unique<char[]>(size);
// Automatically freed on scope exit
```

```cpp
// NEVER: Out-of-bounds access
void process(double* data, int n) {
  for (int i = 0; i <= n; ++i) {  // Off-by-one!
    data[i] = 0.0;
  }
}

// ALWAYS: Bounds-safe containers and span
void process(std::span<double> data) {
  for (auto& val : data) {
    val = 0.0;
  }
}
```

## Data Race Prevention

```cpp
// NEVER: Unprotected shared state
int counter = 0;
void increment() { ++counter; }  // Data race!

// ALWAYS: Proper synchronization
std::atomic<int> counter{0};
void increment() { counter.fetch_add(1, std::memory_order_relaxed); }

// Or use mutex for complex operations
std::mutex mtx;
void update_state() {
  std::lock_guard lock(mtx);
  // ... safe access
}
```

## Integer Overflow Prevention

```cpp
// NEVER: Unchecked arithmetic
size_t total = count * element_size;  // May overflow!

// ALWAYS: Checked arithmetic
if (count > std::numeric_limits<size_t>::max() / element_size) {
  throw std::overflow_error("Allocation size overflow");
}
size_t total = count * element_size;
```

## Sanitizer Usage (MANDATORY in CI)

```bash
# AddressSanitizer: buffer overflow, use-after-free, memory leaks
cmake -B build -DCMAKE_CXX_FLAGS="-fsanitize=address -fno-omit-frame-pointer"

# UndefinedBehaviorSanitizer: UB, integer overflow, null deref
cmake -B build -DCMAKE_CXX_FLAGS="-fsanitize=undefined"

# ThreadSanitizer: data races, deadlocks
cmake -B build -DCMAKE_CXX_FLAGS="-fsanitize=thread"

# MemorySanitizer: uninitialized memory reads (Clang only)
cmake -B build -DCMAKE_CXX_FLAGS="-fsanitize=memory -fno-omit-frame-pointer"
```

## CWE Top 25 Relevant to C++

| CWE | Description | Prevention |
|-----|-------------|------------|
| CWE-787 | Out-of-bounds Write | Use `std::vector`, `std::span`, range checks |
| CWE-125 | Out-of-bounds Read | Use `.at()`, `std::span`, ASan |
| CWE-416 | Use After Free | RAII, smart pointers, no raw `delete` |
| CWE-190 | Integer Overflow | Checked arithmetic, `std::numeric_limits` |
| CWE-476 | NULL Pointer Deref | `std::optional`, references, `[[nodiscard]]` |
| CWE-362 | Race Condition | `std::mutex`, `std::atomic`, TSan |
| CWE-401 | Memory Leak | RAII, smart pointers, ASan/LSan |
| CWE-134 | Format String | `std::format` (C++20), never user-controlled format |
| CWE-119 | Buffer Overflow | `std::string`, `std::vector`, no C arrays |
| CWE-120 | Classic Buffer Overflow | No `strcpy`/`strcat`/`sprintf`, use std:: alternatives |

## Secret Management

```cpp
// NEVER: Hardcoded secrets
const std::string api_key = "sk-proj-xxxxx";

// ALWAYS: Environment variables or config files
const char* api_key = std::getenv("API_KEY");
if (!api_key) {
  throw std::runtime_error("API_KEY environment variable not set");
}
```

## Static Analysis Tools

```bash
# clang-tidy security checks
clang-tidy src/*.cpp -- -std=c++20 \
  -checks='bugprone-*,cert-*,clang-analyzer-security.*,misc-*'

# cppcheck
cppcheck --enable=all --std=c++20 src/
```

## Security Response Protocol

If security issue found:
1. STOP immediately
2. Use **security-reviewer** agent
3. Fix CRITICAL issues before continuing
4. Run full sanitizer suite
5. Review entire codebase for similar issues
