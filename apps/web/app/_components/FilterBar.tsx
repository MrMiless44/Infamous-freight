'use client';

import { useState } from 'react';

interface FilterOption {
  value: string;
  label: string;
}

interface Filter {
  id: string;
  label: string;
  options: FilterOption[];
}

interface FilterBarProps {
  filters: Filter[];
  onFilterChange: (filterId: string, value: string) => void;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
}

export default function FilterBar({
  filters,
  onFilterChange,
  searchPlaceholder = 'Search...',
  onSearchChange,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    onSearchChange?.(value);
  };

  const handleFilterChange = (filterId: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [filterId]: value }));
    onFilterChange(filterId, value);
  };

  const activeCount = Object.values(activeFilters).filter(
    (v) => v && v !== '',
  ).length;

  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery('');
    onSearchChange?.('');
    filters.forEach((f) => onFilterChange(f.id, ''));
  };

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800 bg-[#161b22] p-4 sm:flex-row sm:items-center">
      {/* Search Input */}
      <div className="relative flex-1">
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
        >
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-slate-700/50 bg-slate-800/40 py-2 pl-9 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none transition-colors focus:border-blue-500/50 focus:bg-slate-800/80"
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((filter) => (
          <select
            key={filter.id}
            value={activeFilters[filter.id] || ''}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="rounded-lg border border-slate-700/50 bg-slate-800/40 px-3 py-2 text-sm text-slate-300 outline-none transition-colors focus:border-blue-500/50 [&>option]:bg-[#161b22]"
          >
            <option value="">{filter.label}</option>
            {filter.options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ))}

        {/* Active filter count / clear */}
        {activeCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/50 bg-blue-600/10 px-3 py-2 text-xs font-medium text-blue-400 transition-colors hover:bg-blue-600/20"
          >
            <span>{activeCount} active</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path
                d="M4 4l6 6M10 4l-6 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
