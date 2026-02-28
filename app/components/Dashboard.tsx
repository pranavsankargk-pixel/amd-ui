import { useEffect, useState } from "react";
import { API_BASE } from "../lib/api";
import Animation from "./Animation";

export default function Dashboard({ onNavigate }: { onNavigate: (section: string) => void }) {
  const [stats, setStats] = useState({
    subjects: 0,
    qtypes: 0,
    languages: 0,
    endpoints: 0,
  });
  const [display, setDisplay] = useState({
    subjects: 0,
    qtypes: 0,
    languages: 0,
    endpoints: 0,
  });

  useEffect(() => {
    // fetch metadata once for stat cards
    fetch(`${API_BASE}/subjects`)
      .then((r) => r.json())
      .then((data) => {
        const subjects = Object.keys(data.subjects || {}).length;
        setStats((s) => ({ ...s, subjects }));
      })
      .catch(() => {});

    fetch(`${API_BASE}/languages`)
      .then((r) => r.json())
      .then((data) => {
        const languages = (data.languages || []).length;
        setStats((s) => ({ ...s, languages }));
      })
      .catch(() => {});

    // hardcode qtypes and endpoints
    setStats((s) => ({
      ...s,
      qtypes: 4,
      endpoints: 10,
    }));
  }, []);

  // animate display numbers when stats change
  useEffect(() => {
    const duration = 1000;
    const stepTime = 20;
    Object.keys(stats).forEach((key) => {
      const target = (stats as any)[key];
      let current = 0;
      const step = target / (duration / stepTime);
      const iv = setInterval(() => {
        current += step;
        if (current >= target) {
          current = target;
          clearInterval(iv);
        }
        setDisplay((d) => ({ ...d, [key]: Math.round(current) }));
      }, stepTime);
    });
  }, [stats]);

  return (
    <div className="space-y-12">
      {/* hero banner with split layout */}
      <section className="hero relative flex flex-col-reverse md:flex-row items-center justify-center gap-8 py-12">
        {/* text block sits above animation on small screens */}
        <div className="z-10 text-center md:text-left max-w-xl">
          <h1 className="text-[42px]">AI-Powered Engineering</h1>
          <h1 className="gradient text-[42px]">Upskilling Platform</h1>
          <p className="mt-4">
            GATE ECE Prep + Placement Training<br />
            Powered by LLaMA 3 running locally on AMD hardware
          </p>
        </div>
        {/* animation on hero with blending background placed beside text */}
        <div className="anim-bg w-64 h-64 flex-shrink-0">
          {/* assistant bot animation centered */}
          <Animation
            file="Man and robot with computers sitting together in workplace.json"
            style={{ width: '100%', height: '100%' }}
          />
        </div>
      </section>

      {/* stats */}
      <section className="stat-grid">
        <div className="stat-card blue">
          <div className="number">{display.subjects}</div>
          <div className="label">GATE Subjects</div>
          <div className="icon text-blue-400">📘</div>
        </div>
        <div className="stat-card green">
          <div className="number">{display.qtypes}</div>
          <div className="label">Question Types</div>
          <div className="icon text-green-400">🧠</div>
        </div>
        <div className="stat-card purple">
          <div className="number">{display.languages}</div>
          <div className="label">Languages</div>
          <div className="icon text-purple-400">🌐</div>
        </div>
        <div className="stat-card orange">
          <div className="number">{display.endpoints}</div>
          <div className="label">API Endpoints</div>
          <div className="icon text-orange-400">🔌</div>
        </div>
      </section>

      {/* quick actions */}
      <section className="quick-grid">
        <div className="quick-card" onClick={() => onNavigate('gate')}>
          <div className="text-4xl">🧠</div>
          <div className="mt-2 font-bold">Generate Question</div>
          <div className="mt-1 text-sm text-gray-300">Start practicing with AI-generated GATE questions</div>
          <div className="arrow">➔</div>
        </div>
        <div className="quick-card" onClick={() => onNavigate('fulltest')}>
          <div className="text-4xl">📄</div>
          <div className="mt-2 font-bold">Take a Full Test</div>
          <div className="mt-1 text-sm text-gray-300">Time-scaled paper from 10 min to 3 hours</div>
          <div className="arrow">➔</div>
        </div>
        <div className="quick-card" onClick={() => onNavigate('interview')}>
          <div className="text-4xl">🎤</div>
          <div className="mt-2 font-bold">Interview Practice</div>
          <div className="mt-1 text-sm text-gray-300">Role-based technical interview coaching</div>
          <div className="arrow">➔</div>
        </div>
      </section>
    </div>
  );
}
