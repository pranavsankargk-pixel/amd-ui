"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { t } from "../lib/translate";
import Animation from "./Animation";

interface InterviewFormProps {
  language: string;
  addToast: (msg: string, type?: 'success' | 'error') => void;
  setLanguage?: (lang: string) => void;
}

export default function InterviewForm({ language, addToast, setLanguage }: InterviewFormProps) {
  const [form, setForm] = useState({
    role: "",
    domain: "",
    difficulty: "medium",
    include_audio: true,
  });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  type InterviewSections = {
    question?: string;
    answer?: string;
    followups?: string[];
    criteria?: string[];
    mistakes?: string;
    tips?: string;
  };
  const [secs, setSecs] = useState<InterviewSections>({});


  const parseInterview = (text: string) => {
    const lines = text.split(/\r?\n/);
    const out: InterviewSections = {};
    let cur: keyof InterviewSections | null = null;
    let buf: string[] = [];
    for (let line of lines) {
      const h = line.trim().toUpperCase();
      if (
        h.startsWith("**1. INTERVIEW QUESTION**") ||
        h.startsWith("**१. इंटरव्यू प्रश्न**") ||
        /^प्रश्न[:：]/i.test(h)
      ) {
        if (cur && buf.length) (out as any)[cur] = buf.join("\n");
        cur = "question";
        buf = [];
        continue;
      }
      if (
        h.startsWith("**2. MODEL ANSWER") ||
        h.startsWith("**२. मॉडल उत्तर") ||
        /^उत्तर[:：]/i.test(h)
      ) {
        if (cur && buf.length) (out as any)[cur] = buf.join("\n");
        cur = "answer";
        buf = [];
        continue;
      }
      if (h.startsWith("**3. FOLLOW-UP")) {
        if (cur && buf.length)
          (out as any)[cur] = buf
            .join("\n")
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter(Boolean);
        cur = "followups";
        buf = [];
        continue;
      }
      if (h.startsWith("**4. EVALUATION")) {
        if (cur && buf.length)
          (out as any)[cur] = buf
            .join("\n")
            .split(/\r?\n/)
            .map((l) => l.replace(/^[-*]\s*/, "").trim())
            .filter(Boolean);
        cur = "criteria";
        buf = [];
        continue;
      }
      if (h.startsWith("**5. COMMON CANDIDATE MISTAKES**")) {
        if (cur && buf.length) (out as any)[cur] = buf.join("\n");
        cur = "mistakes";
        buf = [];
        continue;
      }
      if (h.startsWith("**6. TIPS FOR THE CANDIDATE**")) {
        if (cur && buf.length) (out as any)[cur] = buf.join("\n");
        cur = "tips";
        buf = [];
        continue;
      }
      if (cur) buf.push(line);
    }
    if (cur && buf.length) (out as any)[cur] = buf.join("\n");

    // fallback splits if we have question text but no answer
    if (out.question && !out.answer) {
      const joined = lines.join("\n");
      const split = joined.split(/\n(?=उत्तर[:：])|\n(?=MODEL ANSWER)/i);
      if (split.length > 1) {
        out.question = split[0].trim();
        out.answer = split[1].replace(/^उत्तर[:：]\s*/i, "").trim();
      }
    }

    // Hindi/other-language fallback: if nothing was parsed assume the whole text is the question
    if (!out.question && text.trim()) {
      out.question = text;
    }

    // if there is no answer but question contains explicit 'Answer' string later, split it
    if (!out.answer && out.question) {
      const q = out.question;
      const ansSplit = q.split(/(?=\bAnswer[:：])|(?=\bउत्तर[:：])/i);
      if (ansSplit.length > 1) {
        out.question = ansSplit[0].trim();
        out.answer = ansSplit[1].replace(/^(?:Answer|उत्तर)[:：]\s*/i, '').trim();
      }
    }

    setSecs(out);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setShowAnswer(false);
    setSecs({});
    const resp = await fetch(`${API_BASE}/interview-agent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language }),
    });
    const data = await resp.json();
    setResult(data);
    if (data.success && data.interview_content) {
      parseInterview(data.interview_content);
      addToast("Interview prep ready", "success");
    } else {
      addToast("Interview generation failed", "error");
    }
    setLoading(false);
  };

  // quick role suggestions
  const SUGGESTIONS = [
    "VLSI Engineer",
    "Embedded Developer",
    "Signal Processing Engineer",
    "RF Engineer",
    "PCB Designer",
    "Hardware Engineer",
    "IoT Developer",
  ];

  // track which evaluation criteria user checks
  const [checkedCriteria, setCheckedCriteria] = useState<string[]>([]);
  const toggleCriteria = (c: string) => {
    setCheckedCriteria((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">
      {!loading && !result && (
        <div className="flex justify-center mb-6">
          <Animation file="teach.json" style={{ width: 200, height: 200 }} />
        </div>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <Animation file="teach.json" style={{ width: 100, height: 100 }} />
        </div>
      )}
      {result && result.success && (
        <div className="absolute top-4 right-4">
          <Animation file="Teachers.json" style={{ width: 60, height: 60 }} loop={false} />
        </div>
      )}
      <h2 className="text-[28px] font-semibold text-light">
        {t(language, "Interview Preparation Agent")}
      </h2>
      <div className="flex flex-col lg:flex-row gap-8">
        {/* left form card */}
        <div className="card p-6 flex-1">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-light">{t(language,'Role')}</label>
              <input
                name="role"
                value={form.role}
                onChange={handleChange}
                placeholder="e.g. VLSI Design Engineer"
                required
                className="w-full bg-card border border-primary text-light p-3 rounded"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-light">{t(language,'Domain')}</label>
              <input
                name="domain"
                value={form.domain}
                onChange={handleChange}
                placeholder="e.g. Digital Circuits"
                required
                className="w-full bg-card border border-primary text-light p-3 rounded"
              />
            </div>
            <div>
              <div className="text-sm font-bold text-light mb-1">{t(language,'Difficulty Level')}</div>
              <div className="flex gap-2">
                {['easy','medium','hard'].map((d) => (
                  <div
                    key={d}
                    onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                    className={`difficulty-btn ${d} ${form.difficulty===d?'selected':''}`}
                  >
                    {d.charAt(0).toUpperCase()+d.slice(1)}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="lang-toggle">
                <div
                  className={`lang-pill ${language==='English'?'selected':''}`}
                  onClick={() => setLanguage && setLanguage('English')}
                >English</div>
                <div
                  className={`lang-pill ${language==='Hindi'?'selected':''}`}
                  onClick={() => setLanguage && setLanguage('Hindi')}
                >Hindi</div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="include_audio"
                  checked={form.include_audio}
                  onChange={handleChange}
                  id="audio"
                  className="mr-1"
                />
                <label htmlFor="audio" className="text-light">{t(language,'Include Audio')}</label>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="gradient-btn bg-green-to-blue"
            >
              🎤 Get Interview Question
            </button>
          </form>
        </div>
        {/* right suggestions */}
        <div className="flex-1">
          <div className="text-light font-semibold mb-2">{t(language,'Popular Roles')}</div>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((r) => (
              <span
                key={r}
                className="suggestion-chip"
                onClick={() => setForm(f => ({ ...f, role: r }))}
              >
                {r}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="mt-8 flex flex-col items-center space-y-2">
          <div className="spinner" />
          <div>LLaMA 3 is thinking...</div>
        </div>
      )}

      {result && (
        <div className="mt-6 space-y-6">
          {result.success ? (
            <>
              {/* question card */}
              {secs.question && (
                <div className="result-section interview-question-card">
                  <span className="absolute top-2 left-2 text-2xl">🎤</span>
                  <div className="text-xl font-semibold text-light">
                    {secs.question}
                  </div>
                </div>
              )}

              {/* model answer */}
              <div className="result-section">
                <button
                  className="reveal-btn"
                  onClick={() => setShowAnswer(v => !v)}
                >
                  💡 {showAnswer ? 'Hide Model Answer' : 'Show Model Answer'}
                </button>
                {showAnswer && secs.answer && (
                  <div className="mt-2 correct-card">
                    {secs.answer}
                  </div>
                )}
              </div>

              {/* followups */}
              {secs.followups && (
                <div className="result-section followup-card">
                  <ol className="list-decimal list-inside">
                    {secs.followups.map((q,i)=>(
                      <li key={i} className="flex items-center gap-2">
                        {q} <span className="ml-auto">➤</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* criteria */}
              {secs.criteria && (
                <div className="result-section criteria-card">
                  {secs.criteria.map((c,i)=>(
                    <div key={i} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={checkedCriteria.includes(c)}
                        onChange={() => toggleCriteria(c)}
                        className="mr-2"
                      />
                      {c}
                    </div>
                  ))}
                </div>
              )}

              {/* mistakes */}
              {secs.mistakes && (
                <div className="result-section">
                  {secs.mistakes.split(/\r?\n/).map((m,i)=>(
                    <div key={i} className="mistake-card">
                      ⚠️ {m}
                    </div>
                  ))}
                </div>
              )}

              {/* tips */}
              {secs.tips && (
                <div className="result-section">
                  {secs.tips.split(/\r?\n/).map((t,i)=>(
                    <div key={i} className="tip-card">
                      💚 {t}
                    </div>
                  ))}
                </div>
              )}

              {result.audio_file && (
                <div className="result-section audio-card">
                  <audio controls src={`${API_BASE}/audio/${result.audio_file}`} />
                </div>
              )}
            </>
          ) : (
            <div className="text-red-600">Error: {result.detail || "Unknown"}</div>
          )}
        </div>
      )}
    </div>
  );
}
