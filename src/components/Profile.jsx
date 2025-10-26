import { useEffect, useMemo, useState } from 'react';

const LS_KEY = 'pixel-trainer-habits-v1';

export default function Profile() {
  const [habits, setHabits] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      setHabits(raw ? JSON.parse(raw) : []);
    } catch {
      setHabits([]);
    }
  }, []);

  const stats = useMemo(() => {
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((a, h) => a + (h.completions?.length || 0), 0);
    const totalStreak = habits.reduce((a, h) => a + (h.streak || 0), 0);
    const trainerLevel = Math.floor(Math.sqrt(totalCompletions) + totalHabits / 2);
    const badges = computeBadges({ totalCompletions, totalStreak, totalHabits });
    return { totalHabits, totalCompletions, totalStreak, trainerLevel, badges };
  }, [habits]);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold">Trainer Profile</h2>
      <p className="text-sm text-slate-300">Your pixel journey at a glance</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Trainer Level" value={stats.trainerLevel} />
        <Stat label="Habits" value={stats.totalHabits} />
        <Stat label="Completions" value={stats.totalCompletions} />
        <Stat label="Total Streak" value={stats.totalStreak} />
      </div>

      <div className="mt-8">
        <h3 className="font-bold">Badges</h3>
        {stats.badges.length === 0 ? (
          <p className="mt-2 text-sm text-slate-300">Earn badges by completing habits and building streaks.</p>
        ) : (
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {stats.badges.map((b) => (
              <li key={b.id} className="rounded-xl border border-white/10 bg-slate-900/40 p-4">
                <div className="text-lg font-extrabold bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                  {b.title}
                </div>
                <p className="mt-1 text-xs text-slate-300">{b.desc}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-slate-900/40 p-4 text-center">
      <div className="text-3xl font-black">{value}</div>
      <div className="text-xs text-slate-300">{label}</div>
    </div>
  );
}

function computeBadges({ totalCompletions, totalStreak, totalHabits }) {
  const list = [];
  if (totalCompletions >= 1) list.push({ id: 'starter', title: 'Starter Badge', desc: 'First completion achieved' });
  if (totalCompletions >= 10) list.push({ id: 'novice', title: 'Novice Trainer', desc: '10 total completions' });
  if (totalCompletions >= 30) list.push({ id: 'adept', title: 'Adept Trainer', desc: '30 total completions' });
  if (totalCompletions >= 100) list.push({ id: 'master', title: 'Master Trainer', desc: '100 total completions' });
  if (totalStreak >= 7) list.push({ id: 'streak7', title: 'Streak Ember', desc: '7 total streak count' });
  if (totalStreak >= 30) list.push({ id: 'streak30', title: 'Streak Blaze', desc: '30 total streak count' });
  if (totalHabits >= 5) list.push({ id: 'collector', title: 'Collector', desc: 'Create 5 habits' });
  return list;
}
