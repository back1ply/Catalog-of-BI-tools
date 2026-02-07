import { useState, useMemo, useCallback, useEffect } from 'react';
import toolsData from '../data/tools.json';

const FILTER_DIMENSIONS = {
  generation: { key: 'generationShort', label: 'Generation' },
  userFocus: { key: 'userFocus', label: 'User Focus', isArray: true },
  optimizedFor: { key: 'optimizedFor', label: 'Optimized For', isArray: true },
  deployment: { key: 'deployment', label: 'Deployment', isArray: true },
  pricing: { key: 'pricing', label: 'Pricing', isArray: true },
  queryUsing: { key: 'queryUsing', label: 'Query Using', isArray: true },
};

function getHashFilters() {
  try {
    const hash = window.location.hash.slice(1);
    if (!hash) return {};
    return JSON.parse(decodeURIComponent(hash));
  } catch {
    return {};
  }
}

function setHashFilters(filters) {
  const clean = {};
  for (const [k, v] of Object.entries(filters)) {
    if (Array.isArray(v) && v.length > 0) clean[k] = v;
    else if (typeof v === 'string' && v) clean[k] = v;
  }
  const hash = Object.keys(clean).length
    ? '#' + encodeURIComponent(JSON.stringify(clean))
    : '';
  window.history.replaceState(null, '', window.location.pathname + hash);
}

// Extract all unique values for each filter dimension
function getFilterOptions() {
  const options = {};
  for (const [dim, config] of Object.entries(FILTER_DIMENSIONS)) {
    const values = new Set();
    toolsData.forEach(tool => {
      const val = tool[config.key];
      if (config.isArray && Array.isArray(val)) {
        val.forEach(v => values.add(v));
      } else if (val) {
        values.add(val);
      }
    });
    options[dim] = [...values].sort();
  }
  return options;
}

export const filterOptions = getFilterOptions();

export default function useToolFilters() {
  const initial = getHashFilters();
  const [search, setSearch] = useState(initial.search || '');
  const [filters, setFilters] = useState(() => {
    const f = {};
    for (const dim of Object.keys(FILTER_DIMENSIONS)) {
      f[dim] = initial[dim] || [];
    }
    return f;
  });
  const [highlightedTool, setHighlightedTool] = useState(null);

  // Persist to hash
  useEffect(() => {
    const data = { ...filters };
    if (search) data.search = search;
    setHashFilters(data);
  }, [filters, search]);

  const toggleFilter = useCallback((dimension, value) => {
    setFilters(prev => {
      const current = prev[dimension] || [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [dimension]: next };
    });
  }, []);

  const clearFilters = useCallback(() => {
    setSearch('');
    const f = {};
    for (const dim of Object.keys(FILTER_DIMENSIONS)) {
      f[dim] = [];
    }
    setFilters(f);
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = search ? 1 : 0;
    for (const vals of Object.values(filters)) {
      count += vals.length;
    }
    return count;
  }, [filters, search]);

  const filteredTools = useMemo(() => {
    return toolsData.filter(tool => {
      // Text search
      if (search) {
        const q = search.toLowerCase();
        const haystack = [
          tool.name,
          ...tool.features,
          ...tool.dwIntegrations,
          tool.generation,
        ].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }

      // Dimension filters (AND across dimensions, OR within)
      for (const [dim, config] of Object.entries(FILTER_DIMENSIONS)) {
        const active = filters[dim];
        if (!active || active.length === 0) continue;

        const val = tool[config.key];
        if (config.isArray) {
          if (!Array.isArray(val) || !active.some(a => val.includes(a))) return false;
        } else {
          if (!active.includes(val)) return false;
        }
      }

      return true;
    });
  }, [search, filters]);

  return {
    tools: toolsData,
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
  };
}
