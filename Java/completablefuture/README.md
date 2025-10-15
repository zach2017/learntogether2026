# a Spring service example with a `summarize` function using `CompletableFuture`

**Three methods demonstrating different CompletableFuture patterns:**

1. **`summarize(String text)`** — The simplest example that asynchronously processes text and returns a summary using `supplyAsync()`.

2. **`summarizeFromUrl(String url)`** — Shows how to chain async operations using `thenApplyAsync()`, simulating fetching content first, then summarizing it.

3. **`summarizeMultiple(String text1, String text2)`** — Demonstrates combining multiple async tasks with `thenCombine()`, running both summarizations in parallel and merging results.

To use this in a Spring controller, you could do:

```java
@RestController
@RequestMapping("/api")
public class SummarizeController {
    
    private final SummarizeService summarizeService;
    
    public SummarizeController(SummarizeService summarizeService) {
        this.summarizeService = summarizeService;
    }
    
    @GetMapping("/summarize")
    public CompletableFuture<String> summarize(@RequestParam String text) {
        return summarizeService.summarize(text);
    }
}
```

The `CompletableFuture` allows non-blocking asynchronous execution, making your application more responsive!