import { Home, Award, User } from 'lucide-react';

export default function BottomNav({ activeTab, onChange, tabs }) {
  const items = [
    { key: tabs.HABITS, label: 'Habits', Icon: Home },
    { key: tabs.ACHIEVEMENTS, label: 'Achievements', Icon: Award },
    { key: tabs.PROFILE, label: 'Profile', Icon: User },
  ];

  return (
    <nav aria-label="Primary" className="fixed bottom-0 inset-x-0 z-20 border-t border-white/10 bg-slate-900/70 backdrop-blur">
      <ul className="mx-auto flex max-w-5xl items-stretch justify-around px-2 py-2">
        {items.map(({ key, label, Icon }) => (
          <li key={key} className="flex-1">
            <button
              aria-current={activeTab === key ? 'page' : undefined}
              aria-label={label}
              onClick={() => onChange(key)}
              className={`group w-full flex flex-col items-center gap-1 rounded-xl px-2 py-2 transition ${
                activeTab === key ? 'text-white' : 'text-slate-300 hover:text-white'
              }`}
            >
              <Icon className={`h-5 w-5 ${activeTab === key ? 'drop-shadow' : ''}`} />
              <span className="text-xs">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
