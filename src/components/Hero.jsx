export default function Hero({ totalTools, filteredCount, activeFilterCount }) {
  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
          Catalog of BI Tools
        </h1>
        <p className="mt-2 text-lg text-gray-600 max-w-2xl">
          An interactive catalog of {totalTools} Business Intelligence tools across 4 generations.
          Filter, sort, and explore the BI landscape.
        </p>
        <p className="mt-1 text-sm text-gray-400">
          Based on the{' '}
          <a
            href="https://notion.castordoc.com/catalog-of-bi-tools"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 underline underline-offset-2"
          >
            Castor Catalog of BI Tools
          </a>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Stat label="Total Tools" value={totalTools} />
          <Stat label="Showing" value={filteredCount} />
          {activeFilterCount > 0 && (
            <Stat label="Active Filters" value={activeFilterCount} />
          )}
        </div>
      </div>
    </header>
  );
}

function Stat({ label, value }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-semibold text-gray-900">{value}</span>
    </div>
  );
}
