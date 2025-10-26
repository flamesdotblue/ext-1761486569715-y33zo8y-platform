import { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'pixel-trainer-habits-v1';

export default function Achievements() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setHabits(raw ? JSON.parse(raw) : []);
    } catch {
      setHabits([]);
    }
  }, []);

  const entries = useMemo(() => {
    const result = [];
    habits.forEach((h) => {
      const completes = h.completions || [];
      result.push({
        id: h.id,
        name: h.name,
        type: h.type,
        captures: completes.length,
        stage: Math.min(2, Math.floor((h.levelXP || 0) / 34)),
        streak: h.streak || 0,
      });
    });
    return result.sort((a, b) => b.captures - a.captures);
  }, [habits]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Pokedex Achievements</h2>
      <p className="text-sm text-slate-300">Track your evolved creatures and milestones</p>

      {entries.length === 0 ? (
        <div className="mt-6 rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center">
          <p className="text-slate-300">Complete habits to fill your Pokedex.</p>
        </div>
      ) : (
        <ul role="list" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entries.map((e) => (
            <li key={e.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold">{e.name}</div>
                  <div className="text-xs text-slate-300">Stage {e.stage + 1} • {e.captures} completes • Streak {e.streak}</div>
                </div>
                <TypePill type={e.type} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function TypePill({ type }) {
  const map = {
    flame: { label: 'Flame', color: 'bg-orange-500/20 text-orange-300' },
    aqua: { label: 'Aqua', color: 'bg-sky-500/20 text-sky-300' },
    leaf: { label: 'Leaf', color: 'bg-emerald-500/20 text-emerald-300' },
  };
  const t = map[type] || map.flame;
  return (
    <span className={`rounded-full px-3 py-1 text-xs ${t.color}`} aria-label={`${t.label} type`}>
      {t.label}
    </span>
  );
}
