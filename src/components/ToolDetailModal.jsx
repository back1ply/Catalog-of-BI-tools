const GEN_BADGE = {
  'Gen 1': 'bg-indigo-100 text-indigo-700',
  'Gen 2': 'bg-blue-100 text-blue-700',
  'Gen 3': 'bg-emerald-100 text-emerald-700',
  'Gen 4+': 'bg-amber-100 text-amber-700',
};

export default function ToolDetailModal({ tool, onClose }) {
  if (!tool) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between rounded-t-xl">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{tool.name}</h2>
            {tool.website && (
              <a
                href={tool.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline"
              >
                {tool.website.replace('https://', '')}
              </a>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <Row label="Generation">
            {tool.generationShort ? (
              <span className={`inline-block px-2.5 py-0.5 rounded text-sm font-medium ${GEN_BADGE[tool.generationShort] || 'bg-gray-100 text-gray-700'}`}>
                {tool.generationShort}
              </span>
            ) : <span className="text-gray-400">-</span>}
          </Row>

          <Row label="Optimized For">
            <Tags items={tool.optimizedFor} />
          </Row>

          <Row label="User Focus">
            <Tags items={tool.userFocus} />
          </Row>

          <Row label="Deployment">
            <Tags items={tool.deployment} />
          </Row>

          <Row label="Pricing">
            <Tags items={tool.pricing} />
          </Row>

          <Row label="Query Using">
            <Tags items={tool.queryUsing} />
          </Row>

          <Row label="DW Integrations">
            <Tags items={tool.dwIntegrations} />
          </Row>

          <Row label="Features">
            <Tags items={tool.features} />
          </Row>

          {tool.nativeConnectors && (
            <Row label="Native Connectors">
              <span className="text-gray-900 font-medium">{tool.nativeConnectors}</span>
            </Row>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Tags({ items }) {
  if (!items || items.length === 0) return <span className="text-gray-400 text-sm">-</span>;
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(item => (
        <span key={item} className="inline-block bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-sm">
          {item}
        </span>
      ))}
    </div>
  );
}
