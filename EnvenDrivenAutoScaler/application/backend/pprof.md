
# 🔍 Memory Analysis Commands

| Command | What It Shows | Use Case |
|---------|---------------|----------|
| `top` | Functions with most memory currently in use | Find current memory hogs |
| `top20` | Top 20 memory-consuming functions | Broader view of memory usage |
| `peek expense-tracker` | Memory usage in your application code | Isolate your code from standard library |
| `sample_index=inuse_space` | Switch to currently allocated memory view | Find what's holding memory now |
| `sample_index=alloc_space` | Switch to total allocations view | Find what allocates most memory |
| `top10` | Top 10 functions with current view settings | Quick overview |
| `list functionName` | Detailed source code with allocation info | Pinpoint exact allocation locations |

### 🚀 Additional Powerful Commands

#### Memory Analysis
```
(pprof) web           # Opens visual graph (requires graphviz)
(pprof) png           # Save graph as PNG file
(pprof) text          # Text-based detailed view
(pprof) tree          # Call tree visualization
(pprof) focus regex   # Filter to specific functions
(pprof) ignore regex  # Exclude specific functions
(pprof) hide regex    # Hide functions from output
```

#### CPU Analysis
```
# First capture CPU profile
curl "http://localhost:7070/debug/pprof/profile?seconds=30" -o cpu.pprof
go tool pprof cpu.pprof

(pprof) top           # Hottest CPU functions
(pprof) web           # CPU flame graph
(pprof) peek regex    # CPU usage in specific code
```

## 🎯 Complete Memory Leak Detection Workflow

### Step 1: Baseline Analysis
```bash
# Take baseline
curl "http://localhost:7070/debug/pprof/heap?gc=1" -o baseline.pprof
go tool pprof baseline.pprof
(pprof) top
(pprof) peek your-app-name
```

### Step 2: Load Test
```bash
# Apply load
hey -n 1000 -c 10 http://localhost:7070/your-endpoint
```

### Step 3: Comparison Analysis
```bash
# Take after profile
curl "http://localhost:7070/debug/pprof/heap?gc=1" -o after.pprof
go tool pprof -diff_base=baseline.pprof after.pprof
(pprof) top
(pprof) sample_index=inuse_space
(pprof) top
(pprof) sample_index=alloc_space
(pprof) top
```

## 🔧 Advanced Memory Analysis Commands

### Find Specific Leak Patterns
```
(pprof) focus your-app-name    # Only your code
(pprof) ignore runtime         # Exclude runtime
(pprof) hide bufio             # Hide buffer allocations
(pprof) nodefraction=0.001     # Show tiny allocations
(pprof) edgefraction=0.001     # Show tiny call edges
```

### Goroutine Leak Detection
```bash
curl "http://localhost:7070/debug/pprof/goroutine" -o goroutines.pprof
go tool pprof goroutines.pprof
(pprof) top
(pprof) peek your-app-name
(pprof) web
```

### Block/Contention Analysis
```bash
curl "http://localhost:7070/debug/pprof/block" -o block.pprof
go tool pprof block.pprof
(pprof) top
```

### Mutex Contention
```bash
curl "http://localhost:7070/debug/pprof/mutex" -o mutex.pprof
go tool pprof mutex.pprof
(pprof) top
```

## 🚨 CPU Leak Detection Commands

### CPU Profiling
```bash
# Capture 30-second CPU profile
curl "http://localhost:7070/debug/pprof/profile?seconds=30" -o cpu.pprof
go tool pprof cpu.pprof

(pprof) top           # Hottest functions
(pprof) web           # Visual flame graph
(pprof) peek your-app-name
(pprof) list functionName
```

### CPU Optimization
```
(pprof) sample_index=cpu   # Ensure CPU sampling
(pprof) top20
(pprof) focus your-app-name
(pprof) ignore runtime
```

## 🎯 Most Useful Commands for Leak Detection

### For Memory Leaks:
1. `go tool pprof -diff_base=before.pprof after.pprof` - Compare profiles
2. `pprof> peek your-app-name` - Isolate your code
3. `pprof> sample_index=inuse_space` - Current memory usage
4. `pprof> web` - Visual graph

### For CPU Leaks:
1. `pprof> top` - Find CPU hotspots
2. `pprof> list functionName` - Detailed analysis
3. `pprof> web` - CPU flame graph

### For Goroutine Leaks:
1. `pprof> peek your-app-name` - Find your goroutines
2. `pprof> web` - Visual goroutine graph

## 💡 Pro Tips

1. **Always use `?gc=1`** when taking heap profiles
2. **Focus on your application code**, not standard library
3. **Look for consistent growth** between profiles
4. **Use visual graphs** (`web`) for complex patterns
5. **Combine multiple views** (inuse_space + alloc_space)

## 🏆 Key Takeaways

- **`top`** = Quick overview
- **`peek`** = Isolate your code
- **`sample_index`** = Switch between memory types
- **`web`** = Visual analysis
- **`-diff_base`** = Compare profiles over time