Got it. Here’s a clean, **manual**, repeatable way to “train” (specialize/steer) an Ollama model to generate **Java 21 Spring Boot Controllers**. It uses a **Modelfile** with a strong SYSTEM prompt, an optional **custom TEMPLATE** (so all prompts follow your schema), and a couple of **few-shot examples** baked in. No extra tooling required—just `ollama`.

---

# 1) Prerequisites

* Install **Ollama**: [https://ollama.com/download](https://ollama.com/download)
* Pick a compact, code-capable base model that runs locally (examples: `qwen2.5-coder:1.5b`, `codegemma:2b`, or a larger one if you have VRAM like `llama3.1:8b-instruct`).

---

# 2) Project layout

```
spring-controller-model/
├─ Modelfile
├─ templates/
│  └─ controller_prompt.md
└─ examples/
   ├─ 01_orders_user.txt
   └─ 01_orders_assistant.java
```

---

# 3) Prompt Template (for users of the model)

This is a **human-facing** template your team can reuse when crafting prompts. Save as `templates/controller_prompt.md`.

````md
# Spring Controller Prompt

Controller Name: {{ControllerName}}
Base Path: {{BasePath}}
Endpoints: 
{{Endpoints}}
Entities/DTOs:
{{Entities}}
Additional Requirements:
{{Additional}}

## Output Rules
- Output **only** Java code in a single fenced block: ```java … ```
- Java 21 + Spring Boot 3 + Jakarta namespaces
- Use @RestController, @RequestMapping, @GetMapping/@PostMapping/@PutMapping/@DeleteMapping
- Annotate args (@PathVariable, @RequestParam, @RequestBody), use records for DTOs
- Return ResponseEntity<T> or ProblemDetail where appropriate
- Include complete imports
````

You can substitute the double-braced placeholders as needed.

---

# 4) Few-shot Examples (baked “training” exemplars)

### `examples/01_orders_user.txt`

```
Controller Name: OrderController
Base Path: /api/v1/orders
Endpoints:
- POST: /
- GET: /{id}
- GET: /
- PUT: /{id}
- DELETE: /{id}

Entities/DTOs:
- Order(id: Long, total: BigDecimal, status: String)
- CreateOrderRequest(total: BigDecimal)
- UpdateOrderRequest(status: String)

Additional Requirements:
- Use ResponseEntity
- Validate inputs (jakarta.validation)
- ProblemDetail for errors
```

### `examples/01_orders_assistant.java`

> This is the **gold** answer you want the model to emulate. Keep it concise and correct.

```java
package com.example.api;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping(path = "/api/v1/orders", produces = MediaType.APPLICATION_JSON_VALUE)
public class OrderController {

  private final OrderService service;

  public OrderController(OrderService service) {
    this.service = service;
  }

  @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Order> create(@Valid @RequestBody CreateOrderRequest req) {
    Order created = service.create(req);
    return ResponseEntity.status(HttpStatus.CREATED).body(created);
  }

  @GetMapping("/{id}")
  public ResponseEntity<Order> getById(@PathVariable Long id) {
    return service.findById(id)
      .map(ResponseEntity::ok)
      .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
  }

  @GetMapping
  public ResponseEntity<List<Order>> list() {
    return ResponseEntity.ok(service.findAll());
  }

  @PutMapping(path = "/{id}", consumes = MediaType.APPLICATION_JSON_VALUE)
  public ResponseEntity<Order> update(@PathVariable Long id, @Valid @RequestBody UpdateOrderRequest req) {
    return ResponseEntity.ok(service.update(id, req));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<Void> delete(@PathVariable Long id) {
    service.delete(id);
    return ResponseEntity.noContent().build();
  }

  public record Order(Long id, @Positive BigDecimal total, @NotBlank String status) {}
  public record CreateOrderRequest(@Positive BigDecimal total) {}
  public record UpdateOrderRequest(@NotBlank String status) {}

  public interface OrderService {
    Order create(CreateOrderRequest req);
    Optional<Order> findById(Long id);
    List<Order> findAll();
    Order update(Long id, UpdateOrderRequest req);
    void delete(Long id);
  }
}
```

> Add more example pairs over time (02\_customers\_user/assistant, etc.). Quality > quantity.

---

# 5) The Modelfile (the “training” file)

This is where you **specialize** the base model with:

* A strict **SYSTEM** role that constrains output
* Optional **TEMPLATE** so all prompts follow your schema
* **MESSAGE** blocks that bake in your few-shot examples

Create `Modelfile`:

````dockerfile
# === Base model ===
# Swap this to another supported base if you prefer.
FROM qwen2.5-coder:1.5b

# === Inference parameters ===
PARAMETER temperature 0.2
PARAMETER num_ctx 8192

# === Optional: Prompt TEMPLATE ===
# This ensures a consistent chat layout and forces the assistant to output only a java fenced block.
# If your base model already has a solid template, you can omit this section.
TEMPLATE """
{{- if .System }}SYSTEM:
{{ .System }}
{{- end}}
{{- range .Messages }}
{{ .Role | upper }}:
{{ .Content }}
{{- end}}

ASSISTANT (OUTPUT RULES):
Output ONLY Java code in ONE fenced block like:
```java
// your code
````

"""

# === Global system rules ===

SYSTEM <\<SYS
You are "SpringControllerMaker", an expert Java Spring Boot API controller generator.

Hard constraints:

* Output ONLY Java code inside a single `java fenced block` — no prose, no markdown outside the fence.
* Java 21 + Spring Boot 3 + Jakarta packages; complete imports.
* Use @RestController, @RequestMapping, and @Get/Post/Put/DeleteMapping.
* Annotate arguments (@PathVariable, @RequestParam, @RequestBody). Validate with jakarta.validation when helpful.
* Use records for DTOs when appropriate.
* Return ResponseEntity<T> or ProblemDetail for errors.
* Include a minimal service interface if needed to show method shapes.
* Never include build files (pom/gradle) unless asked.
* If input is ambiguous, choose sensible names and document via JavaDoc INSIDE the code only.
  SYS

# === Few-shot: Example 01 (Orders) ===

MESSAGE role=user @examples/01\_orders\_user.txt
MESSAGE role=assistant @examples/01\_orders\_assistant.java

````

> Notes:
> - `TEMPLATE` uses a simple role header style. If you switch to a model with a very strict native chat template, you may prefer to **omit TEMPLATE** and rely on the base model’s default.
> - `MESSAGE` lines pull in your example files. Add more to strengthen style adherence.

---

# 6) Build the specialized model
From the folder containing your `Modelfile`:

```bash
ollama create spring-controller -f Modelfile
````

* This produces a local model named `spring-controller`.
* To list models: `ollama list`
* To remove/rebuild later: `ollama rm spring-controller`

---

# 7) Test interactively

Use the **same prompt schema** your team will follow. For quick tests:

```bash
ollama chat spring-controller
```

Then paste something like:

```
Controller Name: CustomerController
Base Path: /api/v1/customers
Endpoints:
- POST: /
- GET: /{id}
- GET: /
- PUT: /{id}
- DELETE: /{id}

Entities/DTOs:
- Customer(id: Long, email: String, name: String)
- CreateCustomerRequest(email: String, name: String)
- UpdateCustomerRequest(email: String, name: String)

Additional Requirements:
- Validate email
- ResponseEntity
- ProblemDetail for not found
```

You should get **only** a `java` block with a full controller.

---

# 8) Programmatic call (HTTP)

```bash
curl http://localhost:11434/api/chat -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "model":"spring-controller",
    "messages":[
      {"role":"user","content":"Controller Name: InvoiceController\nBase Path: /api/v1/invoices\nEndpoints:\n- POST: /\n- GET: /{id}\nEntities/DTOs:\n- Invoice(id: Long, amount: BigDecimal)\n- CreateInvoiceRequest(amount: BigDecimal)\nAdditional Requirements:\n- Validation\n- ResponseEntity"}
    ],
    "stream": false
  }'
```

Parse `message.content` from the JSON and write it to a `.java` file.

---

# 9) Iteration playbook

* **Output leaks prose** → tighten SYSTEM, keep TEMPLATE, and add a clear “ONLY java fenced block” rule (already included).
* **Wrong annotations/types** → add 1–2 targeted few-shots that demonstrate correct use.
* **Too verbose/too terse** → adjust examples to reflect preferred style.
* **Model hallucination** → lower temperature further (e.g., `0.1`) and add precise examples.
* **Bigger context** → increase `num_ctx` if your prompts/examples are long.
* **Performance** → choose a smaller base or upgrade to a faster GPU.

---

## TL;DR “Training file” template

If you just want a **copy-paste starter** for the Modelfile:

````dockerfile
FROM qwen2.5-coder:1.5b
PARAMETER temperature 0.2
PARAMETER num_ctx 8192

# (Optional) TEMPLATE block — remove if you prefer base model default
TEMPLATE """
{{- if .System }}SYSTEM:
{{ .System }}
{{- end}}
{{- range .Messages }}
{{ .Role | upper }}:
{{ .Content }}
{{- end}}

ASSISTANT (OUTPUT RULES):
Output ONLY Java code in ONE fenced block like:
```java
// your code
````

"""

SYSTEM <\<SYS
You are SpringControllerMaker. Output ONLY Java code in a single `java fenced block`; Java 21 + Spring Boot 3; Jakarta; complete imports; proper annotations; records for DTOs; ResponseEntity/ProblemDetail; optional service interface; no build files unless requested.
SYS

# Few-shot examples (add as many as you need)

# MESSAGE role=user @examples/01\_orders\_user.txt

# MESSAGE role=assistant @examples/01\_orders\_assistant.java

````

And the **prompt schema** users should follow (save as `templates/controller_prompt.md` and reuse):

```md
Controller Name: {{ControllerName}}
Base Path: {{BasePath}}
Endpoints:
{{Endpoints}}
Entities/DTOs:
{{Entities}}
Additional Requirements:
{{Additional}}

Output ONLY Java code in one ```java fenced block```.
````


