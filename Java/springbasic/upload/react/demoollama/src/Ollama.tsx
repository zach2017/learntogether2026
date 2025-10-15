import React, { useMemo, useState } from "react";

/**
 * OllamaFileForm
 * -------------------------------------------------------------
 * A lightweight React + TypeScript form component that uploads a file
 * via multipart/form-data to your backend (e.g., FastAPI route
 * `/analyze-file`) which then forwards to Ollama.
 *
 * Styling: Tailwind CSS (optional). No external UI libs required.
 *
 * Props:
 * - endpoint: string — your API endpoint (default: "/analyze-file")
 * - defaultModel: string — model name to send (default: "llama3")
 * - onSuccess?: (payload: AnalyzeResponse) => void — callback on success
 * - onError?: (err: unknown) => void — callback on error
 *
 * API contract (expected response from backend):
 * {
 *   ok: boolean,
 *   saved_to?: string,
 *   extracted_count?: number,
 *   keywords?: string[],
 *   error?: string
 * }
 */

export type AnalyzeResponse = {
  ok: boolean;
  saved_to?: string;
  extracted_count?: number;
  keywords?: string[];
  error?: string;
};

export type OllamaFileFormProps = {
  endpoint?: string;
  defaultModel?: string;
  onSuccess?: (payload: AnalyzeResponse) => void;
  onError?: (err: unknown) => void;
};

const humanFileSize = (bytes: number) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};

export default function OllamaFileForm({
  endpoint = "/analyze-file",
  defaultModel = "llama3",
  onSuccess,
  onError,
}: OllamaFileFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState<string>(defaultModel);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInfo = useMemo(() => {
    if (!file) return null;
    return {
      name: file.name,
      size: humanFileSize(file.size),
      type: file.type || "(unknown)",
    };
  }, [file]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    if (f) setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const reset = () => {
    setFile(null);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    if (!file) {
      setError("Please select a file.");
      return;
    }

    try {
      setIsSubmitting(true);
      const form = new FormData();
      form.append("file", file);
      form.append("model", model);

      const res = await fetch(endpoint, {
        method: "POST",
        body: form,
      });

      const data: AnalyzeResponse = await res.json();
      if (!res.ok || data.ok === false) {
        const message = data?.error || `Upload failed with status ${res.status}`;
        setError(message);
        onError?.(message);
        return;
      }

      setResult(data);
      onSuccess?.(data);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      onError?.(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Model</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama3"
            className="w-full rounded-lg border border-gray-300 p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500">
            This value is sent to your backend as the <code>model</code> form field.
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className={`border-2 border-dashed rounded-xl p-6 text-center transition ${
            file ? "border-green-400 bg-green-50" : "border-gray-300"
          }`}
        >
          <p className="font-medium">Drag & drop a file here</p>
          <p className="text-sm text-gray-500">or</p>
          <label
            className="inline-block mt-2 px-4 py-2 rounded-lg bg-indigo-600 text-white cursor-pointer hover:bg-indigo-700"
          >
            Choose file
            <input type="file" onChange={handleFileChange} className="hidden" />
          </label>
          {fileInfo && (
            <div className="mt-3 text-sm text-left">
              <div className="font-mono">{fileInfo.name}</div>
              <div className="text-gray-500">{fileInfo.type} • {fileInfo.size}</div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSubmitting || !file}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {isSubmitting ? "Analyzing…" : "Analyze with Ollama"}
          </button>
          <button
            type="button"
            onClick={reset}
            className="px-3 py-2 rounded-lg border"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results / Errors */}
      <div className="mt-6 space-y-3">
        {error && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border p-4">
            <h3 className="font-semibold mb-2">Result</h3>
            <div className="space-y-2">
              {typeof result.saved_to === "string" && (
                <div className="text-sm">
                  <span className="font-medium">Saved to:</span> {result.saved_to}
                </div>
              )}
              <div className="text-sm">
                <span className="font-medium">Extracted Count:</span> {result.extracted_count ?? 0}
              </div>

              {Array.isArray(result.keywords) && result.keywords.length > 0 ? (
                <ul className="flex flex-wrap gap-2 mt-2">
                  {result.keywords.map((kw, i) => (
                    <li
                      key={`${kw}-${i}`}
                      className="px-2 py-1 rounded-full text-xs border bg-gray-50"
                    >
                      {kw}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No keywords returned.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
