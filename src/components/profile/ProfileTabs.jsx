export default function ProfileTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <div className="flex min-w-max gap-2 px-4 py-3">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`rounded-lg px-4 py-2 text-sm font-bold ${
              activeTab === tab
                ? "bg-blue-50 text-forge"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
    </div>
  );
}
