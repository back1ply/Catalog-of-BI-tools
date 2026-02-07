import { useState } from 'react';
import { filterOptions } from '../hooks/useToolFilters';

const GEN_COLORS = {
  'Gen 1': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  'Gen 2': 'bg-blue-100 text-blue-800 border-blue-200',
  'Gen 3': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Gen 4+': 'bg-amber-100 text-amber-800 border-amber-200',
};

export default function FilterBar({
  search, setSearch, filters, toggleFilter, clearFilters, activeFilterCount, FILTER_DIMENSIONS,
}) {
  const [expandedDim, setExpandedDim] = useState(null);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Search + Clear row */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative flex-1 max-w-md">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search tools, features, integrations..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Clear all ({activeFilterCount})
            </button>
          )}
        </div>

        {/* Filter dimensions */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(FILTER_DIMENSIONS).map(([dim, config]) => (
            <FilterDropdown
              key={dim}
              dim={dim}
              label={config.label}
              options={filterOptions[dim] || []}
              active={filters[dim] || []}
              onToggle={val => toggleFilter(dim, val)}
              isExpanded={expandedDim === dim}
              onExpand={() => setExpandedDim(expandedDim === dim ? null : dim)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ dim, label, options, active, onToggle, isExpanded, onExpand }) {
  const hasActive = active.length > 0;

  return (
    <div className="relative">
      <button
        onClick={onExpand}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
          hasActive
            ? 'bg-blue-50 border-blue-200 text-blue-700'
            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
        }`}
      >
        {label}
        {hasActive && (
          <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {active.length}
          </span>
        )}
        <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <>
          <div className="fixed inset-0 z-10" onClick={onExpand} />
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[180px] py-1 max-h-64 overflow-y-auto">
            {options.map(opt => {
              const isActive = active.includes(opt);
              const colorClass = dim === 'generation' ? GEN_COLORS[opt] : null;
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-gray-50 transition-colors ${
                    isActive ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-blue-600 border-blue-600' : 'border-gray-300'
                  }`}>
                    {isActive && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {colorClass ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium border ${colorClass}`}>{opt}</span>
                  ) : (
                    <span>{opt}</span>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
