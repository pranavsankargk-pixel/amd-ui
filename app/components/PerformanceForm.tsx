"use client";
import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import { t } from "../lib/translate";
import Animation from "./Animation";

const SUBJECT_TOPICS: string[] = [
  "Network Theorems","Two Port Networks","Transient Analysis","Resonance",
  "PN Junction","BJT","MOSFET","Optoelectronic Devices",
  "Op-Amp","Oscillators","Amplifiers","Filters",
  "Boolean Algebra","Combinational Circuits","Sequential Circuits","Memory",
  "Fourier Transform","Laplace Transform","Z-Transform","Sampling",
  "Time Response","Frequency Response","Stability","State Space",
  "AM/FM","Digital Modulation","Information Theory","Error Control",
  "Maxwell Equations","Wave Propagation","Transmission Lines","Antennas"
];

interface PerformanceFormProps {
  language: string; // unused but kept for consistency
  addToast: (msg: string, type?: 'success' | 'error') => void;
}

export default function PerformanceForm({ language, addToast }: PerformanceFormProps) {
  const [topic, setTopic] = useState("");
  const [score, setScore] = useState(50);
  const [list, setList] = useState<{topic:string;score:number}[]>([]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addTopic = () => {
    if (topic && !list.find(t => t.topic === topic)) {
      setList([...list, { topic, score: score/100 }]);
    }
  };
  const removeTopic = (t: string) => {
    setList(list.filter(x => x.topic !== t));
  };
  const handleAnalyze = async () => {
    if (list.length === 0) return;
    setLoading(true);
    const attempts: any = {};
    list.forEach((x) => (attempts[x.topic] = x.score));
    const resp = await fetch(`${API_BASE}/performance-analytics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attempts }),
    });
    const data = await resp.json();
    setResult(data);
    if (data.success) addToast("Analytics ready", "success");
    else addToast("Analytics failed", "error");
    setLoading(false);
  };

  const colorForLevel = (level: string) => {
    if (level === "Excellent") return "text-green-400";
    if (level === "Good") return "text-blue-400";
    if (level === "Average") return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 relative">
      {!loading && !result && (
        <div className="flex justify-center mb-6">
          <Animation file="students.json" style={{ width: 180, height: 180 }} />
        </div>
      )}
      {result && result.success && (
        <div className="absolute top-4 right-4">
          <Animation file="Teachers.json" style={{ width: 60, height: 60 }} loop={false} />
        </div>
      )}
      <h2 className="text-[28px] font-semibold text-light">{t(language, "Performance Analytics")}</h2>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="flex-1 bg-card p-2 rounded border border-primary"
          >
            <option value="">-- select topic --</option>
            {SUBJECT_TOPICS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <label className="slider-label">Score:</label>
            <input
              type="range"
              min={0}
              max={100}
              value={score}
              onChange={(e) => setScore(+e.target.value)}
              className="w-32 range-input"
            />
            <span className="text-light font-semibold">{score}%</span>
          </div>
          <button className="bg-green-500 text-background px-3 py-1 rounded" onClick={addTopic}>Add Topic Score</button>
        </div>
        {list.length > 0 && (
          <div className="space-y-2">
            {list.map((x) => {
              const percentage = Math.round(x.score * 100);
              const cat = percentage >= 75 ? "Strength" : percentage >= 50 ? "Moderate" : "Weakness";
              let barColor = "bg-red-500";
              if (percentage >= 75) barColor = "bg-green-500";
              else if (percentage >= 50) barColor = "bg-yellow-500";
              return (
                <div key={x.topic} className="flex items-center space-x-2">
                  <div className="flex-1 truncate">{x.topic}</div>
                  <div className="flex-1 bg-card h-2 rounded overflow-hidden">
                    <div className={`${barColor} h-2`} style={{ width: `${percentage}%` }} />
                  </div>
                  <div className="text-sm font-semibold">{percentage}%</div>
                  {(() => {
                    const badgeColor =
                      cat === 'Strength'
                        ? 'bg-green-600'
                        : cat === 'Moderate'
                        ? 'bg-yellow-600'
                        : 'bg-red-600';
                    return (
                      <div className={`text-xs px-2 py-1 rounded ${badgeColor} text-white`}>{cat}</div>
                    );
                  })()}
                  <button onClick={() => removeTopic(x.topic)}>✕</button>
                </div>
              );
            })}
          </div>
        )}
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="bg-primary text-background px-4 py-2 rounded hover:bg-accent transition-colors w-full"
        >
          {loading ? "Analyzing..." : "Analyse Performance"}
        </button>
      </div>

      {loading && (
        <div className="mt-8 flex flex-col items-center space-y-2">
          <div className="spinner" />
          <div>LLaMA 3 is thinking...</div>
        </div>
      )}

      {result && result.success && (
        <div className="space-y-6">
          {/* readiness circle */}
          <div className="flex flex-col items-center">
            <div className="relative h-32 w-32">
              <svg className="progress-ring" width="128" height="128">
                <circle
                  className="ring-bg"
                  stroke="#333"
                  strokeWidth="8"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                />
                <circle
                  className="ring"
                  stroke={
                    result.readiness_level === 'Excellent' ? '#22c55e' :
                    result.readiness_level === 'Good' ? '#3b82f6' :
                    result.readiness_level === 'Average' ? '#fbbf24' :
                    '#ef4444'
                  }
                  strokeWidth="8"
                  fill="transparent"
                  r="56"
                  cx="64"
                  cy="64"
                  strokeDasharray={2 * Math.PI * 56}
                  strokeDashoffset={
                    2 * Math.PI * 56 * (1 - result.readiness_score)
                  }
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-xl font-semibold text-light">
                {Math.round(result.readiness_score*100)}%
              </div>
            </div>
            <div className="mt-2 text-lg text-light">{result.readiness_level}</div>
          </div>

          {/* category columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['strengths','moderate','weaknesses'].map((cat) => {
              const bg = cat === 'strengths' ? 'bg-green-800' : cat === 'moderate' ? 'bg-yellow-800' : 'bg-red-800';
              const icon = cat === 'strengths' ? '✅' : cat === 'moderate' ? '📈' : '❌';
              return (
                <div key={cat} className={`space-y-2 p-3 rounded ${bg} text-light`}>
                  <div className="font-semibold capitalize">{icon} {cat}</div>
                  {result[cat].map((item:any,i:number)=>(
                    <div key={i} className="bg-card p-2 rounded flex justify-between">
                      <span>{item.topic}</span>
                      <span>{Math.round(item.score*100)}%</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* recommendations */}
          {result.recommendations && (
            <ol className="list-none space-y-1">
              {result.recommendations.map((r:any,i:number)=>(
                <li key={i} className="flex items-start">
                  <span className="rec-number">{i+1}</span>
                  <span className="ml-2">{r}</span>
                </li>
              ))}
            </ol>
          )}

          {/* bar chart */}
          {result.strengths && (
            <div>
              <div className="font-semibold text-light">All Scores</div>
              <div className="space-y-1">
                {Object.entries(result.attempts || {}).map(([t,s]:any,i:number)=>(
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-32 truncate text-light">{t}</span>
                    <div className="flex-1 bg-card h-2 rounded overflow-hidden">
                      <div className="bg-primary h-2" style={{width: `${s*100}%`}} />
                    </div>
                    <span className="text-light">{Math.round(s*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {result && !result.success && (
        <div className="text-red-600">Error: {result.error || result.detail || "Unknown"}</div>
      )}
    </div>
  );
}
