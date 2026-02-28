"use client";
import { useState } from "react";
import { API_BASE } from "../lib/api";
import { t } from "../lib/translate";
import Animation from "./Animation";

interface MathValidatorFormProps {
  language: string;
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function MathValidatorForm({ language, addToast }: MathValidatorFormProps) {
  const [expression, setExpression] = useState<string>("");
  const [variable, setVariable] = useState<string>("x");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const examples = [
    { expr: "x**2 - 5*x + 6", sol: ["2", "3"] },
    { expr: "sin(x)", sol: ["0", "pi"] },
    { expr: "x**3 - x", sol: ["-1", "0", "1"] },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const resp = await fetch(`${API_BASE}/validate-math`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression, variable, language }),
      });
      const data = await resp.json();
      if (!data.success) {
        setError(data.error || data.detail || "Unknown error");
        addToast("Math solve failed", "error");
      } else {
        setResult(data);
        addToast("Solution ready", "success");
      }
    } catch (e: any) {
      setError(e.message || "Request failed");
      addToast("Math API error", "error");
    }
    setLoading(false);
  };

  const tLocal = (key: string) => t(language, key);

  const onExample = (expr: string) => {
    setExpression(expr);
  };

  return (
    <div className="max-w-[600px] mx-auto text-center space-y-6 relative">
      {!loading && !result && (
        <div className="flex justify-center mb-4">
          <Animation file="School people.json" style={{ width: 150, height: 150 }} />
        </div>
      )}
      {loading && (
        <div className="flex justify-center mb-4">
          <Animation file="School people.json" style={{ width: 80, height: 80 }} />
        </div>
      )}
      <h2 className="text-[28px] font-semibold text-light">Symbolic Math Solver</h2>
      <div className="text-gray-400">Powered by SymPy</div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder="x**2 - 5*x + 6"
            className="w-full p-4 text-[20px] font-mono bg-card border border-primary rounded placeholder-gray-500"
            required
          />
        </div>
        <div className="flex justify-center">
          <input
            value={variable}
            onChange={(e) => setVariable(e.target.value)}
            placeholder="x"
            className="w-24 p-2 text-center bg-card border border-primary rounded"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="gradient-btn"
        >
          🔢 {loading ? tLocal("thinking") : tLocal("solve")}
        </button>
      </form>

      {loading && (
        <div className="flex justify-center items-center space-x-2">
          <svg
            className="animate-spin h-5 w-5 text-primary"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          <span>{tLocal("thinking")}</span>
        </div>
      )}


      {result && result.success && (
        <div className="space-y-4">
          <div className="p-4 bg-card rounded math-box">
            <div className="font-mono text-lg text-light">{result.expression}</div>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {result.solutions.map((s: string, i: number) => (
              <span key={i} className="px-6 py-3 bg-primary text-background rounded-full text-xl">
                {s}
              </span>
            ))}
          </div>
          <button
            className="text-sm text-card underline mt-2"
            onClick={() => {
              navigator.clipboard.writeText(result.solutions.join(", "));
              addToast("Copied solutions", "success");
            }}
          >
            Copy solutions
          </button>
          <div className="text-xs text-gray-400">{tLocal("powered")}</div>
        </div>
      )}

      <div className="pt-6 border-t border-card">
        <div className="text-gray-500 font-semibold mb-2">Try these examples:</div>
        <div className="grid grid-cols-2 gap-2">
          {examples.map((ex) => (
            <div
              key={ex.expr}
              className="example-card"
              onClick={() => onExample(ex.expr)}
            >
              {ex.expr}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

