

 use **Qwen2.5-0.5B** (tiny + supported), train a LoRA with PyTorch/PEFT on Windows, merge the weights, convert the merged HF model to **GGUF** with `llama.cpp`, quantize, then `ollama create` with a `Modelfile`.

---

# 0) Quick notes (Windows specifics)

* **QLoRA (4-bit via bitsandbytes)**: the official `bitsandbytes` wheel is **Linux-only**. If you want true QLoRA on Windows, run your training in **WSL2** or Linux. Otherwise do a standard LoRA in fp16/bf16 (works fine for **0.5B**), then merge. ([PyPI][1])
* **Convert to GGUF**: use `llama.cpp`’s **`convert-hf-to-gguf.py`** (the old `convert.py` was removed), and then quantize with the included tool. ([GitHub][2])
* **Qwen + llama.cpp**: Qwen’s docs show this exact flow (convert → quantize → run). ([Qwen][3])

---

# 1) Install prerequisites (Windows)

1. Install **Python 3.11 (64-bit)**, **Git**, and **CMake** (or Visual Studio “Desktop development with C++”).
2. (Optional but recommended) install **CUDA Toolkit 12.x** if you have an NVIDIA GPU.
3. Create a project and venv:

```bat
md qwen05b-lora && cd qwen05b-lora
py -3.11 -m venv .venv
.venv\Scripts\activate
python -m pip install --upgrade pip
```

4. Install **PyTorch** (CUDA 12.1 build shown; change if needed):

```bat
pip install --index-url https://download.pytorch.org/whl/cu121 torch torchvision torchaudio
```

5. Core libs:

```bat
pip install transformers datasets peft accelerate trl sentencepiece huggingface_hub safetensors
```

> If you later want **QLoRA**: do it in **WSL2** (Ubuntu) because `bitsandbytes` isn’t supported on native Windows. ([PyPI][1])

---

# 2) Pick a tiny base

We’ll use **Qwen/Qwen2.5-0.5B** (or its *Instruct* variant). Both are on Hugging Face. ([Hugging Face][4])

* Base (easier to specialize): `Qwen/Qwen2.5-0.5B`
* Chat-tuned: `Qwen/Qwen2.5-0.5B-Instruct`

---

# 3) Make a toy dataset

Create `data\train.jsonl` (Alpaca-style instructions), e.g.

```json
{"instruction":"Summarize: LLaMA.cpp converts HF models to GGUF.","input":"","output":"It converts Hugging Face checkpoints to GGUF for fast local inference."}
{"instruction":"Write a short function in Java that adds 2 numbers.","input":"","output":"public int add(int a,int b){return a+b;}"}
```

---

# 4) LoRA fine-tune (PyTorch/PEFT, Windows-friendly)

Create `finetune_lora_qwen05b.py`:

```python
import os, json
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from trl import SFTTrainer
from peft import LoraConfig, TaskType

BASE = os.environ.get("BASE_MODEL", "Qwen/Qwen2.5-0.5B")
OUT  = "outputs/qwen05b-lora"
os.makedirs(OUT, exist_ok=True)

# Tiny dataset (Alpaca-like JSONL)
ds = load_dataset("json", data_files={"train": "data/train.jsonl"})

# Qwen often needs trust_remote_code
tok = AutoTokenizer.from_pretrained(BASE, use_fast=True, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    BASE, torch_dtype="auto", device_map="auto", trust_remote_code=True
)

# Pack instruction to a prompt template (simple)
def format_example(ex):
    inst = ex["instruction"]
    inp  = ex.get("input", "")
    out  = ex["output"]
    if inp:
        prompt = f"### Instruction:\n{inst}\n\n### Input:\n{inp}\n\n### Response:\n"
    else:
        prompt = f"### Instruction:\n{inst}\n\n### Response:\n"
    return {"text": prompt + out}

ds = ds.map(format_example)

# LoRA config (safe default for small Qwen)
peft_conf = LoraConfig(
    task_type=TaskType.CAUSAL_LM, r=16, lora_alpha=32, lora_dropout=0.05,
    # Target common proj layers; works for Qwen-family
    target_modules=["q_proj","k_proj","v_proj","o_proj","gate_proj","up_proj","down_proj"]
)

args = TrainingArguments(
    output_dir=OUT,
    num_train_epochs=1,
    per_device_train_batch_size=2,
    gradient_accumulation_steps=8,
    learning_rate=2e-4,
    logging_steps=10,
    save_steps=100,
    bf16=True,  # if your GPU supports bf16; otherwise set to fp16=True
    optim="adamw_torch",
)

trainer = SFTTrainer(
    model=model,
    peft_config=peft_conf,
    tokenizer=tok,
    train_dataset=ds["train"],
    dataset_text_field="text",
    max_seq_length=1024,
    args=args,
)

trainer.train()
trainer.model.save_pretrained(OUT)        # saves LoRA adapter
tok.save_pretrained(OUT)
print("Finished LoRA training; adapter saved to:", OUT)
```

Run it:

```bat
python finetune_lora_qwen05b.py
```

---

# 5) **Merge** LoRA → full HF model

Create `merge_lora.py`:

```python
import os, torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel

BASE = os.environ.get("BASE_MODEL", "Qwen/Qwen2.5-0.5B")
LORA_DIR = "outputs/qwen05b-lora"
MERGED = "merged-qwen05b"

tok = AutoTokenizer.from_pretrained(BASE, use_fast=True, trust_remote_code=True)
base = AutoModelForCausalLM.from_pretrained(
    BASE, torch_dtype=torch.float16, device_map="cpu", trust_remote_code=True
)
lora = PeftModel.from_pretrained(base, LORA_DIR)
merged = lora.merge_and_unload()   # <-- official PEFT merge
os.makedirs(MERGED, exist_ok=True)
merged.save_pretrained(MERGED, safe_serialization=True)
tok.save_pretrained(MERGED)
print("Merged model saved to:", MERGED)
```

Run it:

```bat
python merge_lora.py
```

> `merge_and_unload()` is the supported way to fold LoRA weights into the base for standalone inference—exactly what we need before GGUF conversion. ([Hugging Face][5])

---

# 6) **Convert to GGUF** with `llama.cpp`

1. Get llama.cpp and build (Windows):

```bat
git clone https://github.com/ggml-org/llama.cpp
cd llama.cpp
cmake -B build
cmake --build build --config Release
```

2. Convert the merged HF folder ➜ **GGUF** (fp16 first):

```bat
cd llama.cpp
python convert-hf-to-gguf.py ..\merged-qwen05b --outfile ..\qwen05b-f16.gguf
```

* Qwen’s docs show this flow and command style; `convert-hf-to-gguf.py` is the current script (the old `convert.py` was removed). ([Qwen][3])

---

# 7) **Quantize** the GGUF (smaller, faster)

From your `llama.cpp` build:

```bat
.\build\bin\llama-quantize.exe ..\qwen05b-f16.gguf ..\qwen05b-q4_k_m.gguf q4_k_m
```

> The quantizer binary may be named `llama-quantize` (or `quantize`) depending on your build; Qwen’s quantization page and community guides cover the common presets like **Q4\_K\_M**. ([Qwen][6])

---

# 8) **Create an Ollama model**

Make a `Modelfile` next to your `.gguf`:

```
FROM ./qwen05b-q4_k_m.gguf

# Optional: keep this super simple.
SYSTEM """
You are a helpful assistant that answers concisely.
"""
PARAMETER temperature 0.2
```

Then:

```bat
ollama create qwen05b-local -f Modelfile
ollama run qwen05b-local
```

If you prefer, you can skip your own conversion and just test an official Qwen **GGUF** first (they publish GGUFs too), but since you just fine-tuned, use your merged + converted file. ([Hugging Face][7])

---

## Optional: Do **QLoRA** on Windows (WSL2)

If you specifically want **QLoRA (4-bit NF4)**, do this inside **WSL2/Ubuntu**, because `bitsandbytes` isn’t supported on native Windows. Steps are identical, but include:

```bash
pip install bitsandbytes==0.43.*  # in WSL/Linux
```

Then fine-tune with `bnb_4bit=True` configs, merge with PEFT, and continue with steps **6–8**. ([PyPI][1])

---

## Licensing heads-up

* **Phi-2** is MIT (commercial-friendly). If you’d rather use Phi-2 instead of Qwen, you can swap the model id and follow the same steps. ([Hugging Face][8])
* **Qwen2.5** models are generally Apache-2.0, but some Qwen variants carry different terms—check the LICENSE on the exact repo you use. ([Hugging Face][9])

---

## Common pitfalls & fixes

* **CUDA OOM** during training: reduce `per_device_train_batch_size`, increase `gradient_accumulation_steps`, or shrink `max_seq_length`.
* **Tokenizer mismatch** when merging: ensure you saved/loaded tokenizer from the same base; for Qwen keep `trust_remote_code=True`.
* **Conversion fails**: make sure you convert the **merged** model folder (not the LoRA adapter). Community and maintainers recommend merging first, then converting. ([GitHub][10])

---

Want this wrapped as a ready-to-run repo structure (scripts, minimal dataset, and a one-click `convert-quantize.bat`)? I can drop that in one go.

[1]: https://pypi.org/project/bitsandbytes/0.42.0/?utm_source=chatgpt.com "bitsandbytes 0.42.0"
[2]: https://github.com/ggml-org/llama.cpp/issues/7658 "Why is convert.py missing? · Issue #7658 · ggml-org/llama.cpp · GitHub"
[3]: https://qwen.readthedocs.io/en/latest/run_locally/llama.cpp.html "llama.cpp - Qwen"
[4]: https://huggingface.co/Qwen/Qwen2.5-0.5B?utm_source=chatgpt.com "Qwen/Qwen2.5-0.5B"
[5]: https://huggingface.co/docs/peft/main/en/developer_guides/lora?utm_source=chatgpt.com "LoRA"
[6]: https://qwen.readthedocs.io/en/latest/quantization/llama.cpp.html?utm_source=chatgpt.com "llama.cpp - Qwen"
[7]: https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF?utm_source=chatgpt.com "Qwen/Qwen2.5-0.5B-Instruct-GGUF"
[8]: https://huggingface.co/microsoft/phi-2/blob/main/LICENSE?utm_source=chatgpt.com "LICENSE · microsoft/phi-2 at main"
[9]: https://huggingface.co/Qwen/Qwen2.5-7B/blob/main/LICENSE?utm_source=chatgpt.com "LICENSE · Qwen/Qwen2.5-7B at main"
[10]: https://github.com/ggml-org/llama.cpp/issues/7062?utm_source=chatgpt.com "Llama3 GGUF conversion with merged LORA Adapter ..."
