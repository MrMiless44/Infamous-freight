'use client';

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="border-b border-slate-800">
      <nav className="-mb-px flex gap-1 overflow-x-auto" role="tablist">
        {tabs.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => onTabChange(tab.id)}
              className={`flex-shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                active
                  ? 'border-blue-500 text-blue-400'
                  : 'border-transparent text-slate-400 hover:border-slate-700 hover:text-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count != null && (
                <span
                  className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    active
                      ? 'bg-blue-600/20 text-blue-400'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
