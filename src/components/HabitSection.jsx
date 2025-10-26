import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, Flame, Droplet, Leaf, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const LS_KEY = 'pixel-trainer-habits-v1';

const TYPES = [
  { id: 'flame', label: 'Flame', color: '#F97316', Icon: Flame },
  { id: 'aqua', label: 'Aqua', color: '#38BDF8', Icon: Droplet },
  { id: 'leaf', label: 'Leaf', color: '#34D399', Icon: Leaf },
];

const FREQS = [
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'monthly', label: 'Monthly' },
];

function useLocalHabits() {
  const [habits, setHabits] = useState(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(habits));
  }, [habits]);

  return [habits, setHabits];
}

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function resetWindowStart(freq) {
  const now = new Date();
  if (freq === 'daily') {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (freq === 'weekly') {
    const d = new Date(now);
    const day = d.getDay();
    const diff = (day + 6) % 7; // start Monday
    d.setDate(d.getDate() - diff);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  // monthly
  const d = new Date(now.getFullYear(), now.getMonth(), 1);
  return d.getTime();
}

function withinWindow(ts, freq) {
  const start = resetWindowStart(freq);
  const now = Date.now();
  return ts >= start && ts <= now;
}

function useNotificationScheduler(habits) {
  useEffect(() => {
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;

    const timers = [];
    const now = new Date();

    habits.forEach((h) => {
      if (!h.reminder?.enabled || !h.reminder?.time) return;
      const [hh, mm] = h.reminder.time.split(':').map(Number);
      const target = new Date();
      target.setHours(hh, mm, 0, 0);
      if (target <= now) target.setDate(target.getDate() + 1);
      const delay = target.getTime() - now.getTime();
      const t = setTimeout(() => {
        new Notification('Habit Reminder', {
          body: `${h.name}: time to train!`,
        });
      }, delay);
      timers.push(t);
    });

    return () => timers.forEach(clearTimeout);
  }, [habits]);
}

function useBeep() {
  const ctxRef = useRef(null);
  return () => {
    try {
      const ctx = ctxRef.current || new (window.AudioContext || window.webkitAudioContext)();
      ctxRef.current = ctx;
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'square';
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => o.stop(), 120);
    } catch {}
  };
}

export default function HabitSection({ onToast }) {
  const [habits, setHabits] = useLocalHabits();
  const [view, setView] = useState('list');

  useNotificationScheduler(habits);
  const beep = useBeep();

  const completeHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const now = Date.now();
        // New streak logic: increase if last completion was within the tracking window
        const lastTs = h.completions?.[h.completions.length - 1] || 0;
        const inWindow = withinWindow(lastTs, h.frequency);
        const newStreak = inWindow ? h.streak + 1 : 1;
        const completions = [...(h.completions || []), now];
        const levelXP = Math.min((h.levelXP || 0) + (h.difficulty === 'hard' ? 8 : h.difficulty === 'medium' ? 5 : 3), 100);
        const evolutions = Math.floor(levelXP / 34); // 0,1,2 evolution stages
        beep();
        return { ...h, completions, lastCompletedAt: now, streak: newStreak, levelXP, evolutions };
      })
    );
    onToast?.('Habit completed! +XP');
  };

  const resetStaleStreaks = () => {
    setHabits((prev) =>
      prev.map((h) => {
        const lastTs = h.lastCompletedAt || 0;
        if (!withinWindow(lastTs, h.frequency)) {
          return { ...h, streak: 0 };
        }
        return h;
      })
    );
  };

  useEffect(() => {
    resetStaleStreaks();
  }, []);

  const addHabit = (h) => {
    setHabits((prev) => [
      ...prev,
      {
        id: generateId(),
        name: h.name,
        type: h.type,
        frequency: h.frequency,
        difficulty: h.difficulty,
        icon: h.icon,
        createdAt: Date.now(),
        lastCompletedAt: 0,
        completions: [],
        streak: 0,
        levelXP: 0,
        evolutions: 0,
        reminder: h.reminder,
      },
    ]);
    onToast?.('Habit added');
    setView('list');
  };

  const removeHabit = (id) => setHabits((prev) => prev.filter((h) => h.id !== id));

  const trainerStats = useMemo(() => {
    const totalCompletions = habits.reduce((a, b) => a + (b.completions?.length || 0), 0);
    const trainerLevel = Math.floor(Math.sqrt(totalCompletions) + habits.length / 2);
    return { totalCompletions, trainerLevel };
  }, [habits]);

  return (
    <div className="p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Your Habits</h2>
          <p className="text-sm text-slate-300">Trainer Level {trainerStats.trainerLevel} • {trainerStats.totalCompletions} total completes</p>
        </div>
        <button
          onClick={() => setView(view === 'list' ? 'add' : 'list')}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 text-sm hover:bg-slate-800/70 focus:outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <PlusCircle className="h-4 w-4" aria-hidden="true" />
          <span>{view === 'list' ? 'Add Habit' : 'Back'}</span>
        </button>
      </div>

      {view === 'add' ? (
        <HabitForm onSubmit={addHabit} />
      ) : (
        <HabitList habits={habits} onComplete={completeHabit} onRemove={removeHabit} />
      )}
    </div>
  );
}

function HabitForm({ onSubmit }) {
  const [name, setName] = useState('');
  const [type, setType] = useState(TYPES[0].id);
  const [frequency, setFrequency] = useState('daily');
  const [difficulty, setDifficulty] = useState('medium');
  const [time, setTime] = useState('08:00');
  const [reminders, setReminders] = useState(true);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      type,
      frequency,
      difficulty,
      icon: type,
      reminder: { enabled: reminders, time: reminders ? time : null },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="name">Habit name</label>
        <input
          id="name"
          aria-label="Habit name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Morning Run"
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:ring-2 focus:ring-pink-400"
        />
      </div>

      <div>
        <label className="block text-sm mb-1">Type (difficulty style)</label>
        <div className="flex gap-2">
          {TYPES.map(({ id, label, color, Icon }) => (
            <button
              key={id}
              type="button"
              aria-pressed={type === id}
              aria-label={label}
              onClick={() => setType(id)}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                type === id
                  ? 'border-white/20 bg-slate-800/80'
                  : 'border-white/10 bg-slate-900/40 hover:bg-slate-900/70'
              }`}
              style={{ color }}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-slate-200">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="frequency">Frequency</label>
        <select
          id="frequency"
          aria-label="Frequency"
          value={frequency}
          onChange={(e) => setFrequency(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
        >
          {FREQS.map((f) => (
            <option key={f.id} value={f.id}>{f.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="difficulty">Difficulty</label>
        <select
          id="difficulty"
          aria-label="Difficulty"
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-400"
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      <div className="sm:col-span-2 flex items-center gap-3">
        <input
          id="reminders"
          type="checkbox"
          checked={reminders}
          onChange={(e) => setReminders(e.target.checked)}
          className="h-4 w-4 accent-emerald-400"
          aria-label="Enable reminders"
        />
        <label htmlFor="reminders" className="text-sm flex items-center gap-2">
          <Bell className="h-4 w-4" aria-hidden="true" /> Enable reminders
        </label>
        <input
          type="time"
          aria-label="Reminder time"
          disabled={!reminders}
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="ml-auto rounded-lg border border-white/10 bg-slate-900/60 px-3 py-2 outline-none disabled:opacity-50"
        />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <button type="submit" className="rounded-lg bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400 px-4 py-2 text-sm font-bold text-slate-900 shadow hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-white/50">
          Add Habit
        </button>
      </div>
    </form>
  );
}

function HabitList({ habits, onComplete, onRemove }) {
  if (habits.length === 0) {
    return (
      <div className="mt-8 rounded-xl border border-white/10 bg-slate-900/40 p-6 text-center">
        <p className="text-slate-300">No habits yet. Add your first to start evolving your pixel team!</p>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {habits.map((h) => (
        <HabitCard key={h.id} habit={h} onComplete={() => onComplete(h.id)} onRemove={() => onRemove(h.id)} />
      ))}
    </div>
  );
}

function spriteColors(type) {
  if (type === 'flame') return ['#3A0A0A', '#F97316', '#FECACA'];
  if (type === 'aqua') return ['#06233F', '#38BDF8', '#BAE6FD'];
  return ['#0A2F1F', '#34D399', '#BBF7D0'];
}

function PixelCreature({ type, stage, label }) {
  const [d1, d2, acc] = spriteColors(type);
  const size = 12; // base pixel size
  const scale = 1 + stage * 0.15;

  // Simple pixel art: 8x8 grid with variations per stage
  const base = [
    '00111100',
    '01333310',
    '13333331',
    '13323331',
    '13333331',
    '01333310',
    '00122100',
    '00011000',
  ];
  const stage2 = [
    '00111100',
    '01333310',
    '13333331',
    '13223321',
    '13333331',
    '01333310',
    '00222100',
    '00012000',
  ];
  const stage3 = [
    '00111100',
    '01333310',
    '13333331',
    '13323331',
    '13333331',
    '01333310',
    '00222200',
    '00122100',
  ];
  const pattern = stage === 0 ? base : stage === 1 ? stage2 : stage3;

  const colorFor = (c) => (c === '0' ? 'transparent' : c === '1' ? d1 : c === '2' ? acc : d2);

  return (
    <div className="mx-auto" role="img" aria-label={`${label} pixel creature stage ${stage + 1}`}>
      <div className="relative" style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
        {pattern.map((row, y) => (
          <div key={y} className="flex">
            {row.split('').map((c, x) => (
              <div key={`${y}-${x}`} style={{ width: size, height: size, background: colorFor(c) }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitCard({ habit, onComplete, onRemove }) {
  const percent = Math.min(100, habit.levelXP || 0);
  const stage = Math.min(2, habit.evolutions || 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-xl border border-white/10 bg-slate-900/50 p-4 shadow-sm hover:border-white/20"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold leading-tight">{habit.name}</h3>
          <p className="text-xs text-slate-300">{habit.frequency} • {habit.difficulty}</p>
        </div>
        <button onClick={onRemove} aria-label={`Remove ${habit.name}`} className="text-xs text-slate-400 hover:text-slate-200">Remove</button>
      </div>

      <div className="mt-4">
        <PixelCreature type={habit.type} stage={stage} label={habit.name} />
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span>Evolution</span>
          <span>{percent}%</span>
        </div>
        <div className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-700">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percent}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="h-full bg-gradient-to-r from-pink-500 via-amber-400 to-emerald-400"
          />
        </div>
        <p className="mt-1 text-xs text-slate-300">Streak: {habit.streak} days</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          {habit.reminder?.enabled && (
            <div className="flex items-center gap-1" aria-label={`Reminder at ${habit.reminder.time}`}>
              <Bell className="h-4 w-4" aria-hidden="true" />
              <span>{habit.reminder.time}</span>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onComplete}
            className="rounded-lg bg-emerald-400/90 px-3 py-1.5 text-sm font-bold text-slate-900 hover:bg-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-300"
          >
            Complete
          </button>
        </div>
      </div>
    </motion.div>
  );
}
