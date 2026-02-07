import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';

const GEN_BADGE = {
  'Gen 1': 'bg-indigo-100 text-indigo-700',
  'Gen 2': 'bg-blue-100 text-blue-700',
  'Gen 3': 'bg-emerald-100 text-emerald-700',
  'Gen 4+': 'bg-amber-100 text-amber-700',
};

const DEPLOY_BADGE = {
  'Cloud': 'bg-sky-100 text-sky-700',
  'On-prem': 'bg-slate-100 text-slate-700',
  'Open-source': 'bg-green-100 text-green-700',
  'Self-hosted': 'bg-purple-100 text-purple-700',
};

function Badge({ text, colorMap }) {
  const cls = colorMap?.[text] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium mr-1 mb-1 ${cls}`}>
      {text}
    </span>
  );
}

function ArrayCell({ values, colorMap }) {
  if (!values || values.length === 0) return <span className="text-gray-400">-</span>;
  return (
    <div className="flex flex-wrap">
      {values.map(v => <Badge key={v} text={v} colorMap={colorMap} />)}
    </div>
  );
}

export default function ToolTable({ data, highlightedTool, onHighlight }) {
  const columns = useMemo(() => [
    {
      accessorKey: 'name',
      header: 'Name',
      size: 150,
      cell: ({ row }) => (
        <a
          href={row.original.website || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-blue-600 hover:text-blue-800 hover:underline"
        >
          {row.original.name}
        </a>
      ),
    },
    {
      accessorKey: 'generationShort',
      header: 'Generation',
      size: 100,
      cell: ({ getValue }) => {
        const val = getValue();
        return val ? <Badge text={val} colorMap={GEN_BADGE} /> : <span className="text-gray-400">-</span>;
      },
    },
    {
      accessorKey: 'optimizedFor',
      header: 'Optimized For',
      size: 160,
      cell: ({ getValue }) => <ArrayCell values={getValue()} />,
      sortingFn: (a, b) => (a.original.optimizedFor?.join('') || '').localeCompare(b.original.optimizedFor?.join('') || ''),
    },
    {
      accessorKey: 'userFocus',
      header: 'User Focus',
      size: 180,
      cell: ({ getValue }) => <ArrayCell values={getValue()} />,
      sortingFn: (a, b) => (a.original.userFocus?.join('') || '').localeCompare(b.original.userFocus?.join('') || ''),
    },
    {
      accessorKey: 'deployment',
      header: 'Deployment',
      size: 160,
      cell: ({ getValue }) => <ArrayCell values={getValue()} colorMap={DEPLOY_BADGE} />,
      sortingFn: (a, b) => (a.original.deployment?.join('') || '').localeCompare(b.original.deployment?.join('') || ''),
    },
    {
      accessorKey: 'pricing',
      header: 'Pricing',
      size: 160,
      cell: ({ getValue }) => <ArrayCell values={getValue()} />,
      sortingFn: (a, b) => (a.original.pricing?.join('') || '').localeCompare(b.original.pricing?.join('') || ''),
    },
    {
      accessorKey: 'queryUsing',
      header: 'Query Using',
      size: 150,
      cell: ({ getValue }) => <ArrayCell values={getValue()} />,
      sortingFn: (a, b) => (a.original.queryUsing?.join('') || '').localeCompare(b.original.queryUsing?.join('') || ''),
    },
    {
      accessorKey: 'features',
      header: 'Features',
      size: 280,
      cell: ({ getValue }) => <ArrayCell values={getValue()} />,
      sortingFn: (a, b) => (a.original.features?.join('') || '').localeCompare(b.original.features?.join('') || ''),
    },
  ], []);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="table-wrapper overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          {table.getHeaderGroups().map(hg => (
            <tr key={hg.id} className="border-b border-gray-200">
              {hg.headers.map(header => (
                <th
                  key={header.id}
                  className="text-left px-3 py-3 font-semibold text-gray-700 bg-gray-50 whitespace-nowrap cursor-pointer select-none hover:bg-gray-100 transition-colors"
                  style={{ minWidth: header.column.getSize() }}
                  onClick={header.column.getToggleSortingHandler()}
                >
                  <div className="flex items-center gap-1">
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getIsSorted() === 'asc' && <span className="text-blue-600">↑</span>}
                    {header.column.getIsSorted() === 'desc' && <span className="text-blue-600">↓</span>}
                    {!header.column.getIsSorted() && <span className="text-gray-300">↕</span>}
                  </div>
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr
              key={row.id}
              className={`border-b border-gray-100 transition-colors ${
                highlightedTool === row.original.name
                  ? 'bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onMouseEnter={() => onHighlight(row.original.name)}
              onMouseLeave={() => onHighlight(null)}
            >
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-3 py-2.5 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No tools match the current filters.
        </div>
      )}
    </div>
  );
}
