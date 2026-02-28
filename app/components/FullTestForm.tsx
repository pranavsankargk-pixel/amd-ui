"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { t } from "../lib/translate"; // kept for other components but not used below
import Animation from "./Animation";

function estimateQuestions(duration: number, type: string) {
  if (type === "PLACEMENT") {
    return Math.max(5, Math.round(duration / 2));
  }
  let total_q = Math.max(5, Math.round(duration / 1.8));
  total_q = Math.min(total_q, 65);
  return total_q;
}

interface FullTestFormProps {
  language: string;
  addToast: (msg: string, type?: 'success' | 'error') => void;
  setLanguage?: (lang: string) => void;
}

export default function FullTestForm({ language, addToast, setLanguage }: FullTestFormProps) {
  const [form, setForm] = useState({
    duration_minutes: 60,
    include_solutions: false,
    test_type: "GATE",
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleTypeClick = (t: string) => setForm((f) => ({ ...f, test_type: t }));
  const handleDuration = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, duration_minutes: +e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowKey(false);
    const resp = await fetch(`${API_BASE}/generate-full-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language }),
    });
    const data = await resp.json();
    setResult(data);
    if (data.success) {
      addToast("Test generated", "success");
    } else {
      addToast("Failed to generate test", "error");
    }
    setLoading(false);
  };

  const totalQs = estimateQuestions(form.duration_minutes, form.test_type);

  const copyPaper = () => {
    if (result?.question_paper) {
      navigator.clipboard.writeText(result.question_paper);
      addToast("Copied paper", "success");
    }
  };

  const downloadPaper = () => {
    if (!result?.question_paper) return;
    const blob = new Blob([result.question_paper], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test_paper.txt";
    a.click();
    URL.revokeObjectURL(url);
    addToast("Downloaded paper", "success");
  };


  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {!loading && !result && (
        <div className="flex flex-col items-center mb-6">
          <Animation file="STUDENT.json" style={{ width: 150, height: 150 }} />
          <div className="mt-2 text-gray-300">Choose your duration!</div>
        </div>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <Animation file="STUDENT.json" style={{ width: 80, height: 80 }} />
        </div>
      )}
      {result && result.success && (
        <div className="absolute top-4 right-4">
          <Animation file="Teachers.json" style={{ width: 60, height: 60 }} loop={false} />
        </div>
      )}
      <h2 className="text-[28px] font-semibold text-light">
        {t(language, "Full Test Generator")}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* test type selector cards */}
        <div className="flex gap-4">
          <div
            onClick={() => handleTypeClick("GATE")}
            className={`test-type-card ${form.test_type === "GATE" ? "selected-gate" : ""}`}
          >
            <div className="icon">🎓</div>
            <div className="mt-2 font-bold">GATE ECE</div>
            <div className="text-sm text-gray-300">Official GATE syllabus</div>
            <div className="text-xs mt-1">65 questions max</div>
          </div>
          <div
            onClick={() => handleTypeClick("PLACEMENT")}
            className={`test-type-card ${form.test_type === "PLACEMENT" ? "selected-placement" : ""}`}
          >
            <div className="icon">💼</div>
            <div className="mt-2 font-bold">Placement Prep</div>
            <div className="text-sm text-gray-300">Aptitude + Technical + Coding</div>
            <div className="text-xs mt-1">Company placement style</div>
          </div>
        </div>

        {/* duration slider */}
        <div>
          <label className="slider-label block mb-1">Test Duration</label>
          <input
            type="range"
            min={10}
            max={180}
            step={5}
            value={form.duration_minutes}
            onChange={handleDuration}
            className="w-full range-input"
          />
          <div className="slider-info">
            ⏱ {form.duration_minutes} minutes &rarr; ~{totalQs} questions &rarr; ~{totalQs} marks
          </div>
        </div>

        {/* toggles row */}
        <div className="flex items-center space-x-4">
          {setLanguage && (
            <div className="lang-toggle">
              <div
                className={`lang-pill ${language === "English" ? "selected" : ""}`}
                onClick={() => setLanguage!("English")}
              >
                English
              </div>
              <div
                className={`lang-pill ${language === "Hindi" ? "selected" : ""}`}
                onClick={() => setLanguage!("Hindi")}
              >
                Hindi
              </div>
            </div>
          )}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="include_solutions"
              checked={form.include_solutions}
              onChange={handleChange}
              id="sol"
              className="mr-1"
            />
            <label htmlFor="sol">Include solutions</label>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="gradient-btn"
        >
            📄 {loading ? t(language,'LLaMA 3 is thinking...') : t(language,'Generate Test Paper')}
        </button>
      </form>

      {loading && (
        <div className="mt-8 flex flex-col items-center space-y-2">
          <div className="spinner" />
          <div>LLaMA 3 is thinking...</div>
        </div>
      )}

      {result && result.success && (
        <div className="space-y-4 relative">
          {/* info bar */}
          <div className="info-bar">
            <div className="info-box-small total-q">Total Questions: {result.total_questions}</div>
            <div className="info-box-small total-m">Total Marks: {result.total_marks}</div>
            <div className="info-box-small time-q">Time/Q: {result.avg_time_per_question_minutes} min</div>
            <div className="info-box-small diff">Difficulty: {result.difficulty_split}</div>
          </div>

          {/* paper card */}
          <div className="paper-card relative">
            {result.question_paper}
            <div className="paper-actions">
              <button onClick={copyPaper} className="paper-action-btn">Copy</button>
              <button onClick={downloadPaper} className="paper-action-btn">Download</button>
            </div>
          </div>

          {/* answer key collapse */}
          {form.include_solutions && (
            <div className={`answer-key ${showKey ? 'answer-key-show' : ''}`}>
              <div
                className="answer-key-header"
                onClick={() => setShowKey((v) => !v)}
              >
                Answer Key
                <span>{showKey ? '▲' : '▼'}</span>
              </div>
              <div className="answer-key-content">
                {result.answer_key || result.question_paper}
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
