import { useState } from 'react';
import useToolFilters from './hooks/useToolFilters';
import Hero from './components/Hero';
import FilterBar from './components/FilterBar';
import ToolTable from './components/ToolTable';
import QuadrantChart from './components/QuadrantChart';
import ToolDetailModal from './components/ToolDetailModal';

export default function App() {
  const {
    tools,
    filteredTools,
    search,
    setSearch,
    filters,
    toggleFilter,
    clearFilters,
    activeFilterCount,
    highlightedTool,
    setHighlightedTool,
    FILTER_DIMENSIONS,
  } = useToolFilters();

  const [selectedTool, setSelectedTool] = useState(null);
  const [view, setView] = useState('both'); // 'both' | 'chart' | 'table'

  return (
    <div className="min-h-screen bg-gray-50">
      <Hero
        totalTools={tools.length}
        filteredCount={filteredTools.length}
        activeFilterCount={activeFilterCount}
      />

      <FilterBar
        search={search}
        setSearch={setSearch}
        filters={filters}
        toggleFilter={toggleFilter}
        clearFilters={clearFilters}
        activeFilterCount={activeFilterCount}
        FILTER_DIMENSIONS={FILTER_DIMENSIONS}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* View toggle */}
        <div className="flex items-center gap-1 mb-4 bg-gray-100 rounded-lg p-1 w-fit">
          {[
            { key: 'both', label: 'Both' },
            { key: 'chart', label: 'Chart' },
            { key: 'table', label: 'Table' },
          ].map(v => (
            <button
              key={v.key}
              onClick={() => setView(v.key)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === v.key
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        {(view === 'both' || view === 'chart') && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 mb-6">
            <QuadrantChart
              data={filteredTools}
              highlightedTool={highlightedTool}
              onHighlight={setHighlightedTool}
              onSelectTool={setSelectedTool}
            />
          </div>
        )}

        {/* Table */}
        {(view === 'both' || view === 'table') && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-4 sm:px-6 py-3 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Tools ({filteredTools.length})
              </h2>
            </div>
            <ToolTable
              data={filteredTools}
              highlightedTool={highlightedTool}
              onHighlight={setHighlightedTool}
            />
          </div>
        )}
      </main>

      <ToolDetailModal
        tool={selectedTool}
        onClose={() => setSelectedTool(null)}
      />
    </div>
  );
}
