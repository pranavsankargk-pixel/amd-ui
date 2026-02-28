"use client";
import { useEffect, useState } from "react";
import GateQuestionForm from "./components/GateQuestionForm";
import { t } from "./lib/translate";
import FullTestForm from "./components/FullTestForm";
import InterviewForm from "./components/InterviewForm";
import PerformanceForm from "./components/PerformanceForm";
import MathValidatorForm from "./components/MathValidatorForm";
import Dashboard from "./components/Dashboard";
import { API_BASE } from "./lib/api";

export default function Home() {
  const [section, setSection] = useState<string>("dashboard");
  const [language, setLanguage] = useState<string>("English");
  const [apiStatus, setApiStatus] = useState<boolean>(false);
  const [toasts, setToasts] = useState<{id:number;message:string;type:'success'|'error'}[]>([]);
  const [fade, setFade] = useState<boolean>(false);

  // language persistence
  useEffect(() => {
    const lang = localStorage.getItem("lang");
    if (lang) setLanguage(lang);
  }, []);
  useEffect(() => {
    localStorage.setItem("lang", language);
  }, [language]);

  // API health polling
  useEffect(() => {
    const checkHealth = () => {
      fetch(`${API_BASE}/health`)
        .then((r) => r.json())
        .then(() => setApiStatus(true))
        .catch(() => setApiStatus(false));
    };
    checkHealth();
    const iv = setInterval(checkHealth, 10000);
    return () => clearInterval(iv);
  }, []);

  // fade transition on section change
  useEffect(() => {
    setFade(false);
    const t = setTimeout(() => setFade(true), 10);
    return () => clearTimeout(t);
  }, [section]);

  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3000);
  };

  const commonProps = { language, addToast, setLanguage };

  const renderSection = () => {
    switch (section) {
      case "dashboard":
        return <Dashboard onNavigate={setSection} />;
      case "gate":
        return <GateQuestionForm {...commonProps} />;
      case "fulltest":
        return <FullTestForm {...commonProps} />;
      case "interview":
        return <InterviewForm {...commonProps} />;
      case "analytics":
        return <PerformanceForm {...commonProps} />;
      case "math":
        return <MathValidatorForm {...commonProps} />;
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex min-h-screen bg-background text-light font-sans">
        {/* fixed left sidebar 260px */}
        <aside className="sidebar">
          <div>
            <div className="sidebar-logo">AI Powered Engineering<br/>Upskilling Platform</div>
            <nav className="mt-8 space-y-2">
              <div
                className={`nav-item ${section==='dashboard'?'nav-active':''}`}
                onClick={() => setSection('dashboard')}
              >🏠 {t(language,'Dashboard')}</div>
              <div
                className={`nav-item ${section==='gate'?'nav-active':''}`}
                onClick={() => setSection('gate')}
              >🧠 {t(language,'GATE Questions')}</div>
              <div
                className={`nav-item ${section==='fulltest'?'nav-active':''}`}
                onClick={() => setSection('fulltest')}
              >📄 {t(language,'Full Test')}</div>
              <div
                className={`nav-item ${section==='interview'?'nav-active':''}`}
                onClick={() => setSection('interview')}
              >🎤 {t(language,'Interview Prep')}</div>
              <div
                className={`nav-item ${section==='analytics'?'nav-active':''}`}
                onClick={() => setSection('analytics')}
              >📊 {t(language,'Analytics')}</div>
              <div
                className={`nav-item ${section==='math'?'nav-active':''}`}
                onClick={() => setSection('math')}
              >🔢 {t(language,'Math Solver')}</div>
            </nav>
          </div>
          <div className="text-xs text-center p-4">Powered by LLaMA 3 + AMD</div>
        </aside>

        <div className="flex-1 flex flex-col">
          <header className="flex items-center justify-between bg-card px-8 py-4 shadow">
            <div className="text-xl font-semibold uppercase">
              {section === 'dashboard' ? t(language, 'Dashboard') :
               section === 'gate' ? t(language, 'Generate GATE Question') :
               section === 'fulltest' ? t(language, 'Full Test Generator') :
               section === 'interview' ? t(language, 'Interview Question Generator') :
               section === 'analytics' ? t(language, 'Performance Analytics') :
               section === 'math' ? t(language, 'Math Solver') : ''}
            </div>
            <div className="flex items-center space-x-4">
              <div className="lang-toggle">
                <div
                  className={`lang-pill ${language === "English" ? "selected" : ""}`}
                  onClick={() => setLanguage("English")}
                >
                  English
                </div>
                <div
                  className={`lang-pill ${language === "Hindi" ? "selected" : ""}`}
                  onClick={() => setLanguage("Hindi")}
                >
                  Hindi
                </div>
              </div>
              <div className="flex items-center">
                <span className={`h-3 w-3 rounded-full mr-1 ${apiStatus ? "bg-green-400 animate-pulse" : "bg-red-400"}`} />
                <span className="text-xs">API {apiStatus ? "Connected" : "Offline"}</span>
              </div>
            </div>
          </header>

          <main className={`flex-1 p-8 overflow-auto transition-opacity transition-transform duration-300 ${fade ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}>{renderSection()}</main>
        </div>

      {/* toast container */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-2 rounded shadow ${t.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
          >
            {t.message}
          </div>
        ))}
      </div>
      </div>
    </>
  );
}
