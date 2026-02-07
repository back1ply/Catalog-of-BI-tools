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

// ── Quadrant coordinates from image ──
// x = generation (1-4), y = user focus (0=technical, 1=business)
const QUADRANT_COORDS = {
  // Gen 1 - Technical
  'Superset':          { x: 0.8,  y: 0.1 },
  'Cluvio':            { x: 0.9,  y: 0.15 },
  'Redash':            { x: 0.9,  y: 0.2 },
  'Microsoft analytics': { x: 0.7, y: 0.2 },
  'Metric insights':   { x: 0.6,  y: 0.3 },
  'Targit':            { x: 0.6,  y: 0.25 },
  // Gen 1 - Business
  'Amazon Quick Sight':{ x: 0.8,  y: 0.35 },
  'Preset':            { x: 1.2,  y: 0.2 },
  // Gen 2 - Technical
  'Domo':              { x: 1.6,  y: 0.38 },
  'Incorta':           { x: 1.7,  y: 0.38 },
  'Alteryx':           { x: 1.8,  y: 0.35 },
  'Looker':            { x: 1.9,  y: 0.38 },
  // Gen 2 - Mixed
  'Tableau':           { x: 1.4,  y: 0.6 },
  'Qlik view':         { x: 1.3,  y: 0.52 },
  'Power BI':          { x: 1.5,  y: 0.45 },
  'Holistics.io':      { x: 1.5,  y: 0.55 },
  'Data Pine':         { x: 1.1,  y: 0.65 },
  'Metabase':          { x: 1.5,  y: 0.7 },
  // Gen 2 - Self-service tools (positioned in Gen 2)
  'Mode':              { x: 3.5,  y: 0.38 },
  'Mprove':            { x: 1.6,  y: 0.5 },
  'Astrato':           { x: 1.8,  y: 0.48 },
  'Baremetrics':       { x: 1.6,  y: 0.45 },
  'Tellery':           { x: 1.7,  y: 0.42 },
  'Bipp':              { x: 1.8,  y: 0.5 },
  'Trevor':            { x: 1.7,  y: 0.45 },
  'Varada':            { x: 1.9,  y: 0.35 },
  'Incorta':           { x: 1.7,  y: 0.38 },
  'Glean':             { x: 1.8,  y: 0.55 },
  'Explo':             { x: 1.7,  y: 0.6 },
  'Einblick':          { x: 1.8,  y: 0.52 },
  // Gen 2 self-service positioned elsewhere
  'Statsbot':          { x: 1.9,  y: 0.4 },
  'Polyture':          { x: 1.8,  y: 0.55 },
  'DataHero':          { x: 2.3,  y: 0.75 },
  'Zepl':              { x: 1.9,  y: 0.3 },
  'Splashback':        { x: 1.7,  y: 0.5 },
  // Gen 3 - Business (top-right quadrant in image)
  'Adverity.com':      { x: 2.6,  y: 0.82 },
  'Verb data':         { x: 2.7,  y: 0.85 },
  'Scuba':             { x: 2.85, y: 0.83 },
  'Whaly':             { x: 3.0,  y: 0.85 },
  'Endor':             { x: 2.7,  y: 0.78 },
  'Gaphext':           { x: 2.5,  y: 0.7 },
  'Y42':               { x: 2.7,  y: 0.7 },
  'ToucanToco':        { x: 2.4,  y: 0.75 },
  'Acho':              { x: 2.5,  y: 0.65 },
  'Veezoo':            { x: 2.6,  y: 0.72 },
  'Macheye':           { x: 2.6,  y: 0.78 },
  // Gen 3 - Technical
  'AnswerRocket':      { x: 2.5,  y: 0.42 },
  'Sisense':           { x: 2.6,  y: 0.4 },
  'Lightdash':         { x: 2.7,  y: 0.25 },
  // Gen 3 - Mixed
  'Atscale':           { x: 2.5,  y: 0.45 },
  // Gen 4+ - Business
  'Omni':              { x: 3.7,  y: 0.8 },
  'Sigma':             { x: 3.8,  y: 0.78 },
  'Virtualitics':      { x: 3.6,  y: 0.68 },
  // Gen 4+ - Technical/Mixed
  'Cube':              { x: 3.6,  y: 0.4 },
  'GoodData':          { x: 3.7,  y: 0.35 },
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
    quadrant: { x: 3.6, y: 0.4 },
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
    quadrant: { x: 3.7, y: 0.8 },
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
    quadrant: { x: 3.6, y: 0.68 },
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
