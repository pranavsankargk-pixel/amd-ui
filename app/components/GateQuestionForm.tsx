"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { t } from "../lib/translate";
import Animation from "./Animation";

const SUBJECTS = {
  Networks: ["Network Theorems", "Two Port Networks", "Transient Analysis", "Resonance"],
  "Electronic Devices": ["PN Junction", "BJT", "MOSFET", "Optoelectronic Devices"],
  "Analog Circuits": ["Op-Amp", "Oscillators", "Amplifiers", "Filters"],
  "Digital Circuits": ["Boolean Algebra", "Combinational Circuits", "Sequential Circuits", "Memory"],
  "Signals and Systems": ["Fourier Transform", "Laplace Transform", "Z-Transform", "Sampling"],
  "Control Systems": ["Time Response", "Frequency Response", "Stability", "State Space"],
  Communications: ["AM/FM", "Digital Modulation", "Information Theory", "Error Control"],
  Electromagnetics: ["Maxwell Equations", "Wave Propagation", "Transmission Lines", "Antennas"],
};

type ResultSections = {
  question?: string;
  options?: string | string[];
  answer?: string;
  solution?: string;
  concept?: string;
  mistakes?: string;
  exam?: string;
  related?: string | string[];
};

interface GateQuestionFormProps {
  language: string;
  addToast: (msg: string, type?: 'success' | 'error') => void;
  setLanguage?: (lang: string) => void;
}

export default function GateQuestionForm({ language, addToast, setLanguage }: GateQuestionFormProps) {
  const [form, setForm] = useState({
    subject: "",
    topic: "",
    difficulty: "medium",
    qtype: "MCQ",
    include_audio: true,
  });
  const [result, setResult] = useState<any>(null);
  const [sections, setSections] = useState<ResultSections>({});
  const [loading, setLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showSolution, setShowSolution] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const topicsForSubject = form.subject ? SUBJECTS[form.subject as keyof typeof SUBJECTS] || [] : [];

  const parseResponse = (text: string) => {
    const lines = text.split(/\r?\n/);
    const secs: ResultSections = {};
    let current: keyof ResultSections | null = null;
    let buffer: string[] = [];
    for (let line of lines) {
      const header = line.trim().toUpperCase();
      if (header.startsWith("**1. QUESTION**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "question";
        buffer = [];
        continue;
      }
      if (header.startsWith("**2. OPTIONS**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "options";
        buffer = [];
        continue;
      }
      if (header.startsWith("**3. CORRECT ANSWER**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "answer";
        buffer = [];
        continue;
      }
      if (header.startsWith("**4. STEP-BY-STEP SOLUTION**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "solution";
        buffer = [];
        continue;
      }
      if (header.startsWith("**5. KEY CONCEPT**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "concept";
        buffer = [];
        continue;
      }
      if (header.startsWith("**6. COMMON MISTAKES**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "mistakes";
        buffer = [];
        continue;
      }
      if (header.startsWith("**7. EXAM INFO**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "exam";
        buffer = [];
        continue;
      }
      if (header.startsWith("**8. RELATED TOPICS**")) {
        if (current && buffer.length) (secs as any)[current] = buffer.join("\n");
        current = "related";
        buffer = [];
        continue;
      }
      if (current) buffer.push(line);
    }
    if (current && buffer.length) (secs as any)[current] = buffer.join("\n");

    // fallback when the model returns a single Hindi/other-language block without English headers
    if (!secs.question && text.trim()) {
      secs.question = text;
    }

    // additional heuristics: if options weren't parsed but question contains labeled choices,
    // split them out (handles english A. B. etc or Hindi unicode numbers)
    if (!secs.options && secs.question) {
      const qtext = secs.question;
      const optSplit = qtext.split(/\n(?=[A-D][\.)]\s)|\n(?=[\u0966-\u096F]+[\.)]\s)/); // english letters or devanagari digits
      if (optSplit.length > 1) {
        // first piece is question, rest contains options
        secs.question = optSplit[0].trim();
        secs.options = optSplit.slice(1).map(o => o.replace(/^[A-D][\.)]\s*/,'').trim());
      } else {
        // if still no split, try generic newline-based fallback
        const lines = qtext.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);
        if (lines.length > 1) {
          secs.question = lines[0];
          secs.options = lines.slice(1);
        }
      }
    }

    // try to pull answer line if present in undifferentiated text
    if (!secs.answer && text) {
      const ansMatch = text.match(/(?:answer|correct answer|उत्तर)[:：]\s*(.+)/i);
      if (ansMatch) {
        secs.answer = ansMatch[1].trim();
      }
    }
    // if still no answer but we separated lines earlier, look for Hindi or English answer markers again
    if (!secs.answer) {
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
      for (let line of lines) {
        if (/^उत्तर[:：]/.test(line)) {
          secs.answer = line.replace(/^उत्तर[:：]\s*/, "");
          break;
        }
        if (/^Answer[:：]/i.test(line)) {
          secs.answer = line.replace(/^Answer[:：]\s*/i, "");
          break;
        }
      }
    }
    // last resort, if answer still missing but options already parsed, maybe answer is appended after options
    if (!secs.answer && secs.options && Array.isArray(secs.options)) {
      const optlines = secs.options;
      const last = optlines[optlines.length - 1];
      const maybe = last.match(/(?:उत्तर|Answer)[:：]\s*(.+)/i);
      if (maybe) {
        secs.answer = maybe[1].trim();
        secs.options = optlines.slice(0, -1);
      }
    }

    if (secs.options && typeof secs.options === 'string') {
      let opts = (secs.options as string).split(/\n+/).map((l) => l.trim()).filter(Boolean);
      // if still a single long string, attempt inline splits by labels
      if (opts.length === 1) {
        const line = opts[0];
        const parts = line.split(/(?=[A-D][\)\.]\s)|(?=[\u0966-\u096F]+[\)\.]\s)/);
        if (parts.length > 1) {
          opts = parts.map((p) => p.replace(/^[A-D][\)\.]\s*/, '').trim());
        }
      }
      secs.options = opts;
    }
    if (secs.related && typeof secs.related === 'string') {
      secs.related = (secs.related as string).split(/,\s*/).map((t) => t.replace(/\*/g, ""));
    }
    setSections(secs);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setSections({});
    setSelectedOption(null);
    setShowSolution(false);
    setShowAnswer(false);
    const resp = await fetch(`${API_BASE}/generate-gate-question`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, language }),
    });
    const data = await resp.json();
    setResult(data);
    if (data.success && data.content) {
      parseResponse(data.content);
      addToast("Question generated", "success");
    } else {
      addToast("Failed to generate", "error");
    }
    setLoading(false);
  };

  const difficultyClasses = (level: string) =>
    `difficulty-btn ${level} ${form.difficulty === level ? "selected" : ""}`;

  const typeClasses = (t: string) =>
    `type-btn ${form.qtype === t ? "selected" : ""}`;

  return (
    <div className="max-w-3xl mx-auto relative">
      {!loading && !result && (
        <div className="flex flex-col items-center mb-6">
          <div className="anim-bg p-4 rounded-xl">
            {/* use a different animation for the question generator */}
            <Animation file="School people.json" style={{ width: 220, height: 220 }} />
          </div>
          <div className="mt-2 text-gray-300">{t(language, "Select a topic and generate!")}</div>
        </div>
      )}
      {loading && (
        <div className="flex justify-center mb-6">
          <div className="anim-bg p-2 rounded-lg">
            {/* smaller version of the generator-specific animation when loading */}
            <Animation file="School people.json" style={{ width: 140, height: 140 }} />
          </div>
        </div>
      )}
      {result && result.success && (
        <div className="absolute top-4 right-4">
          <Animation file="Teachers.json" style={{ width: 60, height: 60 }} loop={false} />
        </div>
      )}
      <h2 className="text-white text-[28px] mb-6">{t(language, "Generate GATE Question")}</h2>
      <div className="glass-card mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* row1 subject/topic */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-white text-sm font-bold mb-2">{t(language, 'Subject')}</div>
              <select
                name="subject"
                value={form.subject}
                onChange={handleChange}
                required
                className=""
              >
                <option value="">-- select --</option>
                {Object.keys(SUBJECTS).map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-white text-sm font-bold mb-2">{t(language, 'Topic')}</div>
              <select
                name="topic"
                value={form.topic}
                onChange={handleChange}
                required
                className=""
              >
                <option value="">-- select --</option>
                {topicsForSubject.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* row2 difficulty */}
          <div>
            <div className="text-white text-sm font-bold mb-2">{t(language,'Difficulty Level')}</div>
            <div className="flex gap-4">
              {['easy','medium','hard'].map((d) => (
                <div
                  key={d}
                  onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                  className={difficultyClasses(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </div>
              ))}
            </div>
          </div>

          {/* row3 question type */}
          <div>
            <div className="text-white text-sm font-bold mb-2">{t(language,'Question Type')}</div>
            <div className="flex gap-4">
              {['MCQ','MSQ','NAT','NUMERICAL'].map((t) => (
                <div
                  key={t}
                  onClick={() => setForm(f => ({ ...f, qtype: t }))}
                  className={typeClasses(t)}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>

          {/* row4 language + audio */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-white text-sm font-bold mb-2">{t(language, 'Language')}</div>
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
            </div>
            <div className="flex items-center">
              <div className="text-white text-sm font-bold mr-2">Include Audio</div>
              <div
                className={`toggle ${form.include_audio?'on':''}`}
                onClick={() => setForm(f=>({...f, include_audio: !f.include_audio}))}
              >
                <div className="toggle-circle" />
              </div>
            </div>
          </div>

          {/* submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-primary to-purple-600 to-purple-600 text-white font-bold text-lg py-4 rounded-lg hover:brightness-110 transform transition hover:scale-105"
          >
            {loading ? t(language,'LLaMA 3 is thinking...') : t(language,'✨ Generate Question')}
          </button>
        </form>
      </div>

      {loading && (
        <div className="mt-8 flex flex-col items-center space-y-2">
          <div className="spinner" />
          <div>LLaMA 3 is thinking...</div>
        </div>
      )}

      {result && result.success && (() => {
        let baseDelay = 0;
        const nextDelay = () => {
          const d = baseDelay;
          baseDelay += 0.1;
          return d;
        };

        return (
          <div className="mt-8 space-y-6">
            {/* Question card */}
            <div
              className="result-section question-card"
              style={{ animationDelay: `${nextDelay()}s` }}
            >
              <span className="question-badge">Question</span>
              <div className="question-text mt-2">{sections.question}</div>
            </div>

            {/* Options list */}
            {sections.options && Array.isArray(sections.options) && (
              <div
                className="result-section"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                <div className="text-blue-400 mb-2">Select your answer</div>
                <div className="options-container">
                  {(sections.options as string[]).map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedOption(letter)}
                        className={`option-btn ${
                          selectedOption === letter ? 'selected' : ''
                        }`}
                        style={{ animationDelay: `${nextDelay()}s` }}
                      >
                        {letter}. {opt.replace(/^[A-D]\)\s*/, '')}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* correct answer reveal */}
            <div
              className="result-section"
              style={{ animationDelay: `${nextDelay()}s` }}
            >
              <button
                className="reveal-btn"
                onClick={() => setShowAnswer((v) => !v)}
              >
                👁 {showAnswer ? 'Hide Answer' : 'Reveal Answer'}
              </button>
              {showAnswer && sections.answer && (
                <div className="correct-card mt-2 slide-down">
                  {sections.answer}
                </div>
              )}
            </div>

            {/* solution accordion */}
            {sections.solution && (
              <div
                className={`result-section solution-accordion ${
                  showSolution ? 'solution-expanded' : ''
                }`}
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                <div
                  className="solution-header"
                  onClick={() => setShowSolution((v) => !v)}
                >
                  📐 Step-by-Step Solution
                  <span className="solution-arrow">➤</span>
                </div>
                <div className="solution-content">
                  {sections.solution}
                </div>
              </div>
            )}

            {/* concept and mistakes */}
            {sections.concept && (
              <div
                className="result-section info-box"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                💡 {sections.concept}
              </div>
            )}
            {sections.mistakes && (
              <div
                className="result-section warn-box"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                ⚠️ {sections.mistakes}
              </div>
            )}

            {/* exam info badges */}
            {sections.exam && (
              <div
                className="result-section"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                {sections.exam.split('|').map((b, i) => (
                  <span
                    key={i}
                    className={`badge ${
                      b.toLowerCase().includes('marks')
                        ? 'green'
                        : b.toLowerCase().includes('time')
                        ? 'blue'
                        : 'gray'
                    }`}
                  >
                    {b.trim()}
                  </span>
                ))}
              </div>
            )}

            {/* related topics */}
            {sections.related && Array.isArray(sections.related) && (
              <div
                className="result-section flex flex-wrap gap-2"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                {sections.related.map((t, i) => (
                  <span key={i} className="topic-chip">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {/* audio player */}
            {result.audio_file && (
              <div
                className="result-section audio-card"
                style={{ animationDelay: `${nextDelay()}s` }}
              >
                <audio controls src={`${API_BASE}/audio/${result.audio_file}`} className="w-full" />
              </div>
            )}
          </div>
        );
      })()}

    </div>
  );
}
