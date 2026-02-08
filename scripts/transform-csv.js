import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── Read & parse CSV ──────────────────────────────────────────────
const raw = readFileSync(join(ROOT, 'Catalog of BI tools.csv'), 'utf-8')
  .replace(/^\uFEFF/, ''); // strip BOM

function parseCSVLine(line) {
  const fields = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

const lines = raw.split(/\r?\n/).filter(l => l.trim());
const headers = parseCSVLine(lines[0]);
const rows = lines.slice(1)
  .map(l => parseCSVLine(l))
  .filter(cols => cols[0] && cols[0].trim()); // skip empty rows

// ── Multi-value token dictionaries (longest first for greedy match) ──
const USER_FOCUS_TOKENS = [
  'Marketing Analytics', 'Business users', 'Data Engineers', 'Analysts'
];
const OPTIMIZED_TOKENS = ['mid-market', 'Enterprise', "SMB's"];
const DEPLOYMENT_TOKENS = ['Open-source', 'Self-hosted', 'On-prem', 'Cloud'];
const PRICING_TOKENS = [
  'Pay per Session', 'Contact Only', 'Usage based', 'free trial',
  'Freemium', 'Undisclosed', 'N/A'
];
const QUERY_TOKENS = [
  'SQL-based language', 'Text query', 'No-code', 'Python', 'LookML',
  'SQL', 'DAX', 'R'
];

function splitMultiValue(value, tokens) {
  if (!value) return [];
  let remaining = value;
  const found = [];
  // Sort tokens longest first
  const sorted = [...tokens].sort((a, b) => b.length - a.length);
  for (const token of sorted) {
    if (remaining.includes(token)) {
      found.push(token);
      remaining = remaining.replace(token, '').trim();
    }
  }
  // Catch anything left over
  if (remaining.trim()) {
    remaining.split(/\s+/).filter(Boolean).forEach(t => {
      if (!found.includes(t)) found.push(t);
    });
  }
  return found;
}

function splitFeatures(value) {
  if (!value) return [];
  // Features are space-separated multi-word phrases - split on known boundaries
  const FEATURE_TOKENS = [
    'Augmented Analytics', 'Augmented analytics',
    'Create no-code data models', 'Create your own data pipeline',
    'Automatic SQL translation', 'Spreadsheet interface',
    'Python & R notebooks', 'ML models creation',
    'Embedded analytics', 'Dashboard builder',
    'Data Preparation', 'Data Integration', 'Data Sharing',
    'Data exploration', 'Data Analysis', 'Data Engineering',
    'Data Modeling', 'Data Movement', 'Data extraction',
    'Data warehousing', 'Data workflow automation', 'Data apps',
    'Application integration', 'Data transformation',
    'Metrics management', 'Performance analysis',
    'Workflow Automation', 'Calculated fields',
    'Row permissions', 'Version control', 'Drill down',
    'Integrated writeback', 'Live query',
    'Business Intelligence', 'Self-service',
    'SQL editor', 'SQL IDE', 'Visualization',
    'Explorations', 'Glossary', 'Ingestion',
    'discovery', 'collaboration', 'interactive dashboards',
    'drilldowns', 'Dbt powered',
  ];
  let remaining = value;
  const found = [];
  const sorted = [...FEATURE_TOKENS].sort((a, b) => b.length - a.length);
  for (const token of sorted) {
    while (remaining.includes(token)) {
      found.push(token);
      remaining = remaining.replace(token, ' ').trim();
    }
  }
  if (remaining.trim()) {
    remaining.split(/\s+/).filter(Boolean).forEach(t => {
      if (t.length > 1 && !found.includes(t)) found.push(t);
    });
  }
  return found;
}

function splitDW(value) {
  if (!value) return [];
  return value.split(/\s+/).filter(Boolean)
    .reduce((acc, token) => {
      // Combine multi-word items like "Azure SQL", "Amazon Athena", "Google analytics"
      const last = acc[acc.length - 1];
      if (last && (
        (last === 'Azure' && token === 'SQL') ||
        (last === 'Amazon' && token === 'Athena') ||
        (last === 'Google' && token === 'analytics') ||
        (last === '25' && token === '+')
      )) {
        acc[acc.length - 1] = last + ' ' + token;
      } else {
        acc.push(token);
      }
      return acc;
    }, []);
}

// ── Generation normalization & inference ──
const GEN_MAP = {
  'Generation 1 - traditional BI': { full: 'Generation 1 - Traditional BI', short: 'Gen 1', num: 1 },
  'Generation 2 - Self-service': { full: 'Generation 2 - Self-service', short: 'Gen 2', num: 2 },
  'Generation 3': { full: 'Generation 3', short: 'Gen 3', num: 3 },
  'Generation 4+': { full: 'Generation 4+', short: 'Gen 4+', num: 4 },
};

// Tools with missing generation - inferred from quadrant image
const INFERRED_GEN = {
  'AnswerRocket': 'Generation 3',
  'Sisense': 'Generation 3',
  'Gaphext': 'Generation 3', // listed as Gaphext in CSV, Graphext in image
  'Y42': 'Generation 3',
  'Adverity.com': 'Generation 3',
  'Verb data': 'Generation 3',
  'Endor': 'Generation 3',
  'Scuba': 'Generation 3',
  'Whaly': 'Generation 3',
  'ToucanToco': 'Generation 3',
  'Mode': 'Generation 4+',
  'Cube': 'Generation 4+',
  'GoodData': 'Generation 4+',
  'Sigma': 'Generation 4+',
  'Omni': 'Generation 4+',
  'Virtualitics': 'Generation 4+',
  'Lightdash': 'Generation 3',
  // Others with missing gen - infer from their characteristics
  'Acho': 'Generation 3',
  'Atscale': 'Generation 3',
  'Statsbot': 'Generation 2 - Self-service',
  'Polyture': 'Generation 2 - Self-service',
  'Veezoo': 'Generation 3',
  'Zepl': 'Generation 2 - Self-service',
  'Microsoft analytics': 'Generation 1 - traditional BI',
  'Macheye': 'Generation 3',
  'DataHero': 'Generation 2 - Self-service',
  'Splashback': 'Generation 2 - Self-service',
};

// ── Quadrant coordinates from reference image ──
// x = generation position, y = user focus (0=technical, 1=business)
// Carefully mapped from the Castor quadrant reference image
const QUADRANT_COORDS = {
  // ═══ GEN 1 — bottom-left column ═══
  // Technical (bottom half)
  'Superset':            { x: 0.55, y: 0.06 },
  'Cluvio':              { x: 0.85, y: 0.04 },
  'Redash':              { x: 0.95, y: 0.10 },
  'Microsoft analytics': { x: 0.85, y: 0.15 },
  'Metric insights':     { x: 0.55, y: 0.28 },
  'Targit':              { x: 0.65, y: 0.22 },
  'Amazon Quick Sight':  { x: 0.85, y: 0.35 },
  'Preset':              { x: 1.25, y: 0.18 },
  // Business (top half) — datapine is in Gen 1 column in the image
  'Data Pine':           { x: 0.85, y: 0.72 },

  // ═══ GEN 2 — second column ═══
  // Business (top half)
  'Metabase':            { x: 1.70, y: 0.92 },
  'Tableau':             { x: 1.60, y: 0.82 },
  'Holistics.io':        { x: 1.85, y: 0.60 },
  'Qlik view':           { x: 1.65, y: 0.58 },
  'Power BI':            { x: 1.70, y: 0.64 },
  // Technical (bottom half)
  'Domo':                { x: 1.65, y: 0.42 },
  'Incorta':             { x: 1.78, y: 0.40 },
  'Alteryx':             { x: 1.85, y: 0.38 },
  'Looker':              { x: 1.98, y: 0.40 },
  // Gen 2 tools not clearly in the reference — position by user focus
  'Mprove':              { x: 1.72, y: 0.55 },
  'Astrato':             { x: 1.90, y: 0.44 },
  'Baremetrics':         { x: 1.68, y: 0.48 },
  'Tellery':             { x: 1.82, y: 0.36 },
  'Bipp':                { x: 1.92, y: 0.52 },
  'Trevor':              { x: 1.78, y: 0.34 },
  'Varada':              { x: 2.00, y: 0.30 },
  'Glean':               { x: 1.88, y: 0.56 },
  'Explo':               { x: 1.80, y: 0.62 },
  'Einblick':            { x: 1.92, y: 0.54 },
  'Statsbot':            { x: 2.05, y: 0.32 },
  'Polyture':            { x: 2.00, y: 0.56 },
  'DataHero':            { x: 2.10, y: 0.70 },
  'Zepl':                { x: 2.05, y: 0.25 },
  'Splashback':          { x: 1.85, y: 0.46 },

  // ═══ GEN 3 — third column ═══
  // Business (top half — the dense cluster at top)
  'Adverity.com':        { x: 2.65, y: 0.92 },
  'Verb data':           { x: 2.75, y: 0.90 },
  'Scuba':               { x: 2.95, y: 0.90 },
  'Whaly':               { x: 3.10, y: 0.92 },
  'ToucanToco':          { x: 2.58, y: 0.86 },
  'Endor':               { x: 2.82, y: 0.84 },
  'Gaphext':             { x: 2.72, y: 0.72 },
  'Y42':                 { x: 2.82, y: 0.72 },
  'Acho':                { x: 2.65, y: 0.68 },
  'Veezoo':              { x: 2.70, y: 0.76 },
  'Macheye':             { x: 2.90, y: 0.80 },
  // Technical (bottom half)
  'AnswerRocket':        { x: 2.65, y: 0.40 },
  'Sisense':             { x: 2.75, y: 0.36 },
  'Lightdash':           { x: 2.80, y: 0.20 },
  'Atscale':             { x: 2.60, y: 0.34 },

  // ═══ GEN 4+ — right column ═══
  // Business (top half)
  'Omni':                { x: 3.55, y: 0.88 },
  'Sigma':               { x: 3.75, y: 0.88 },
  'Virtualitics':        { x: 3.55, y: 0.68 },
  // Technical/Mixed (bottom half)
  'Mode':                { x: 3.45, y: 0.46 },
  'Cube':                { x: 3.60, y: 0.38 },
  'GoodData':            { x: 3.65, y: 0.28 },
};

// ── Transform rows ──
const tools = rows.map(cols => {
  const obj = {};
  headers.forEach((h, i) => {
    obj[h.trim()] = (cols[i] || '').trim();
  });

  const name = obj['Name'];
  if (!name) return null;

  // Generation
  let genRaw = obj['Generation'] || INFERRED_GEN[name] || '';
  // Fix Mode's generation (CSV says Gen 2 but image shows Gen 4+)
  if (name === 'Mode') genRaw = 'Generation 4+';
  if (name === 'Sigma') genRaw = 'Generation 4+';
  if (name === 'GoodData') genRaw = 'Generation 4+';
  if (name === 'Lightdash') genRaw = 'Generation 3';

  const genInfo = GEN_MAP[genRaw] || { full: genRaw, short: genRaw, num: 0 };

  // Coordinates
  const coords = QUADRANT_COORDS[name];
  const x = coords ? coords.x : (genInfo.num || 2) + (Math.random() * 0.4 - 0.2);
  const y = coords ? coords.y : 0.5 + (Math.random() * 0.3 - 0.15);

  // Website URL
  let website = obj['Website'] || '';
  if (website && !website.startsWith('http')) {
    website = 'https://' + website;
  }

  return {
    name,
    website,
    generation: genInfo.full,
    generationShort: genInfo.short,
    generationNum: genInfo.num,
    optimizedFor: splitMultiValue(obj['Optimized for'], OPTIMIZED_TOKENS),
    userFocus: splitMultiValue(obj['User focus'], USER_FOCUS_TOKENS),
    deployment: splitMultiValue(obj['Deployment support'], DEPLOYMENT_TOKENS),
    dataModeling: obj['Data modeling'] || null,
    noCodeInterface: obj['No-code interface'] || null,
    pricing: splitMultiValue(obj['Pricing'], PRICING_TOKENS),
    queryUsing: splitMultiValue(obj['Query using'], QUERY_TOKENS),
    dwIntegrations: splitDW(obj['DW integrations']),
    features: splitFeatures(obj['Features']),
    nativeConnectors: obj['Number of native connectors'] ? parseInt(obj['Number of native connectors']) : null,
    quadrant: { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 },
  };
}).filter(Boolean);

// ── Add tools from quadrant image that are missing from CSV ──
const EXTRA_TOOLS = [
  {
    name: 'Cube',
    website: 'https://cube.dev',
    generation: 'Generation 4+',
    generationShort: 'Gen 4+',
    generationNum: 4,
    optimizedFor: ['mid-market', 'Enterprise'],
    userFocus: ['Data Engineers', 'Analysts'],
    deployment: ['Cloud', 'Self-hosted'],
    dataModeling: null,
    noCodeInterface: null,
    pricing: ['Freemium'],
    queryUsing: ['SQL'],
    dwIntegrations: ['Snowflake', 'BigQuery', 'Redshift', 'PostgreSQL'],
    features: ['Data Modeling', 'Embedded analytics', 'Data Integration'],
    nativeConnectors: null,
    quadrant: { x: 3.60, y: 0.38 },
  },
  {
    name: 'Omni',
    website: 'https://omni.co',
    generation: 'Generation 4+',
    generationShort: 'Gen 4+',
    generationNum: 4,
    optimizedFor: ['mid-market', 'Enterprise'],
    userFocus: ['Business users', 'Analysts'],
    deployment: ['Cloud'],
    dataModeling: null,
    noCodeInterface: null,
    pricing: ['Contact Only'],
    queryUsing: ['SQL', 'No-code'],
    dwIntegrations: ['Snowflake', 'BigQuery', 'Redshift'],
    features: ['Visualization', 'Data Modeling', 'Embedded analytics'],
    nativeConnectors: null,
    quadrant: { x: 3.55, y: 0.88 },
  },
  {
    name: 'Virtualitics',
    website: 'https://virtualitics.com',
    generation: 'Generation 4+',
    generationShort: 'Gen 4+',
    generationNum: 4,
    optimizedFor: ['Enterprise'],
    userFocus: ['Business users', 'Analysts'],
    deployment: ['Cloud', 'On-prem'],
    dataModeling: null,
    noCodeInterface: null,
    pricing: ['Contact Only'],
    queryUsing: ['No-code', 'Python'],
    dwIntegrations: ['Snowflake'],
    features: ['Visualization', 'Data exploration', 'ML models creation'],
    nativeConnectors: null,
    quadrant: { x: 3.55, y: 0.68 },
  },
];

tools.push(...EXTRA_TOOLS);

// ── Write output ──
mkdirSync(join(ROOT, 'src', 'data'), { recursive: true });
writeFileSync(
  join(ROOT, 'src', 'data', 'tools.json'),
  JSON.stringify(tools, null, 2),
  'utf-8'
);

console.log(`Wrote ${tools.length} tools to src/data/tools.json`);

// Print summary
const genCounts = {};
tools.forEach(t => {
  const g = t.generationShort || 'Unknown';
  genCounts[g] = (genCounts[g] || 0) + 1;
});
console.log('Generation distribution:', genCounts);
