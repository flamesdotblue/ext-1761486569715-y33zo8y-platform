import { useEffect, useMemo, useState } from 'react';
import Spline from '@splinetool/react-spline';
import { Toaster, toast } from 'sonner';
import BottomNav from './components/BottomNav';
import HabitSection from './components/HabitSection';
import Profile from './components/Profile';
import Achievements from './components/Achievements';

const TABS = {
  HABITS: 'habits',
  ACHIEVEMENTS: 'achievements',
  PROFILE: 'profile',
};

export default function App() {
  const [activeTab, setActiveTab] = useState(TABS.HABITS);

  // Global palette for Pokémon-inspired pixel aesthetic
  const theme = useMemo(
    () => ({
      bg: 'bg-slate-900',
      panel: 'bg-slate-800/70 backdrop-blur',
      accent: 'from-pink-500 via-amber-400 to-emerald-400',
      text: 'text-slate-100',
    }),
    []
  );

  useEffect(() => {
    // Request permission for notifications on first load
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  return (
    <div className={`${theme.bg} min-h-screen ${theme.text} font-mono`}>      
      <header className="relative w-full h-[320px] sm:h-[420px] overflow-hidden">
        <Spline
          scene="https://prod.spline.design/OIGfFUmCnZ3VD8gH/scene.splinecode"
          style={{ width: '100%', height: '100%' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-slate-900/0 via-slate-900/30 to-slate-900" />
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center text-center px-4">
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]">
            Pixel Trainer Habits
          </h1>
          <p className="mt-2 max-w-xl text-sm sm:text-base text-slate-200/90">
            Build epic routines and evolve your pixel creatures with every streak.
          </p>
        </div>
      </header>

      <main className="pb-28">
        <section className="mx-auto max-w-5xl px-4 -mt-16">
          <div className={`${theme.panel} rounded-2xl border border-white/10 shadow-xl`}>            
            {activeTab === TABS.HABITS && (
              <HabitSection onToast={(m) => toast.success(m)} />
            )}
            {activeTab === TABS.ACHIEVEMENTS && <Achievements />}
            {activeTab === TABS.PROFILE && <Profile />}
          </div>
        </section>
      </main>

      <BottomNav activeTab={activeTab} onChange={(t) => setActiveTab(t)} tabs={TABS} />
      <Toaster position="bottom-center" theme="dark" />
    </div>
  );
}
