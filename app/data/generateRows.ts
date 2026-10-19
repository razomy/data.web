import type { EntityField, TableRow } from '~/types/graph.ts';
import { AUTHORS } from './mockData.ts';

export type { TableRow } from '~/types/graph.ts';

const FIRST_NAMES = ['Sarah', 'Marcus', 'Leilani', 'Ahmad', 'Priya', 'Jake', 'Yuki', 'Diego', 'Fatima', 'Ethan', 'Nour', 'Rin', 'Kofi', 'Sven', 'Aisha', 'Chen', 'Ivan', 'Mira', 'Tariq', 'Zoe', 'Felix', 'Nina', 'Omar', 'Lucia', 'Sam'];
const LAST_NAMES = ['Chen', 'Okonkwo', 'Kahale', 'Rashidi', 'Sharma', 'Williams', 'Tanaka', 'Herrera', 'Al-Amin', 'Brooks', 'Hassan', 'Nakamura', 'Mensah', 'Lindqvist', 'Diallo', 'Wang', 'Petrov', 'Kovac', 'Abbas', 'Müller', 'Becker', 'Popescu', 'Santos', 'Ferrari', 'Park'];
const ROLES = ['Senior Engineer', 'Staff Engineer', 'Principal Engineer', 'Engineering Manager', 'Product Manager', 'Data Scientist', 'ML Engineer', 'DevOps Lead', 'Security Architect', 'Graph Analyst', 'Backend Engineer', 'Frontend Engineer', 'Platform Engineer', 'Research Scientist', 'Solutions Architect'];
const DEPTS = ['Platform Engineering', 'Product', 'Data', 'Infrastructure', 'Security', 'Research', 'Growth', 'Core Services', 'Developer Experience', 'Graph Intelligence'];
const CITIES = ['San Francisco', 'New York', 'London', 'Berlin', 'Singapore', 'Tokyo', 'Toronto', 'Amsterdam', 'Sydney', 'Paris', 'Seoul', 'Dublin', 'Stockholm', 'Zurich', 'Austin'];
const SKILLS_POOL = ['Neo4j', 'Cypher', 'Rust', 'TypeScript', 'Python', 'Kafka', 'Kubernetes', 'GraphQL', 'Gremlin', 'SPARQL', 'Go', 'Java', 'Scala', 'AWS', 'GCP', 'Azure', 'Flink', 'Spark', 'DuckDB', 'ClickHouse'];
const ORG_NAMES = ['DataMesh Labs', 'QuantumGraph Inc', 'NeoLink Corp', 'EdgeDB Systems', 'Hypergraph AI', 'Relational IO', 'SemanticStack', 'NodeBridge Co', 'GraphWave Tech', 'Inference Labs', 'KnowledgeNet', 'SparseGraph', 'OntologyWorks', 'ArcDB Cloud', 'LinkStream'];
const PRODUCT_NAMES = ['QueryForge', 'NodeVault', 'EdgeMapper', 'GraphLens', 'SemanticCore', 'GraphPilot', 'NodeSync', 'RelationIQ', 'HyperView', 'SchemaPath', 'PathFinder', 'SubgraphOS', 'CypherTool', 'GremlinDB', 'SPARQLSync'];
const DOC_TITLES = ['Graph Schema Spec', 'Cypher Optimization Guide', 'Distributed Traversal RFC', 'Ontology Mapping Whitepaper', 'Zero-Copy Edge Protocol', 'GQL ISO Draft', 'Vector-Graph Hybrid Architecture'];
const CONCEPT_NAMES = ['PageRank Centrality', 'Subgraph Isomorphism', 'Label Propagation', 'Louvain Modularity', 'Hypergraph Incidence', 'Knowledge Triple', 'Temporal Graph Motif'];

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length] as T;
}

function pickN<T>(arr: T[], n: number, seed: number): T[] {
  const out: T[] = [];
  for (let i = 0; i < n; i++) {
    const item = arr[(seed + i * 7) % arr.length]!;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

function fakeDate(seed: number): string {
  const year = 2019 + (seed % 7);
  const month = String(1 + (seed % 12)).padStart(2, '0');
  const day = String(1 + (seed % 28)).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function fakeEmail(first: string, last: string, seed: number): string {
  const domains = ['graphcorp.io', 'datastack.dev', 'edgedb.com', 'neograph.ai', 'linkwave.io'];
  return `${first.toLowerCase()}.${last.toLowerCase()}@${pick(domains, seed)}`;
}

const TYPE_COLORS: Record<string, string> = {
  Person: '#00C9A7',
  Organization: '#7B61FF',
  Product: '#FF6B35',
  Event: '#E05A87',
  Document: '#4A9EFF',
  Concept: '#A8FF78',
};

export function generateRows(count: number): TableRow[] {
  const rows: TableRow[] = [];
  const images = [
    'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=64&h=64&fit=crop',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=64&h=64&fit=crop',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=64&h=64&fit=crop',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop',
  ];

  const types = ['Person', 'Organization', 'Product', 'Event', 'Document', 'Concept'];

  for (let i = 0; i < count; i++) {
    const type = pick(types, i * 3 + 1);
    const color = TYPE_COLORS[type]!;
    const author = pick(AUTHORS, i);
    let label = '';
    let fields: EntityField[] = [];

    if (type === 'Person') {
      const first = pick(FIRST_NAMES, i + 1);
      const last = pick(LAST_NAMES, i + 7);
      label = `${first} ${last}`;
      fields = [
        { key: 'firstName', value: first, type: 'string' },
        { key: 'lastName', value: last, type: 'string' },
        { key: 'email', value: fakeEmail(first, last, i), type: 'email' },
        { key: 'role', value: pick(ROLES, i + 3), type: 'string' },
        { key: 'department', value: pick(DEPTS, i + 5), type: 'string' },
        { key: 'employeeId', value: `EMP-${String(1000 + i).padStart(5, '0')}`, type: 'string' },
        { key: 'yearsExperience', value: 2 + (i % 18), type: 'number' },
        { key: 'salary', value: 90000 + (i % 150) * 1000, type: 'number' },
        { key: 'remote', value: i % 3 !== 0, type: 'boolean' },
        { key: 'location', value: pick(CITIES, i + 9), type: 'geo' },
        { key: 'joinDate', value: fakeDate(i), type: 'date' },
        { key: 'lastLogin', value: `2026-09-${String(1 + (i % 19)).padStart(2, '0')}T${String(8 + (i % 12)).padStart(2, '0')}:00:00Z`, type: 'date' },
        { key: 'githubProfile', value: `https://github.com/${first.toLowerCase()}${last.toLowerCase()}`, type: 'url' },
        { key: 'skills', value: pickN(SKILLS_POOL, 3 + (i % 4), i), type: 'array' },
        { key: 'performanceScore', value: parseFloat((6 + (i % 40) / 10).toFixed(1)), type: 'number' },
        { key: 'openSourceContribs', value: i % 200, type: 'number' },
        { key: 'teamSize', value: 2 + (i % 20), type: 'number' },
        { key: 'clearanceLevel', value: `L${1 + (i % 6)}`, type: 'string' },
        { key: 'costCenter', value: `ENG-${String(1 + (i % 20)).padStart(2, '0')}`, type: 'string' },
        { key: 'metadata', value: `{"band":"IC${1 + (i % 6)}","bonus":${5 + (i % 20)},"peerScore":${(7 + (i % 30)) / 10}}`, type: 'json' },
      ];
    } else if (type === 'Organization') {
      label = pick(ORG_NAMES, i + 2) + (i > ORG_NAMES.length ? ` ${Math.floor(i / ORG_NAMES.length)}` : '');
      const founded = 2010 + (i % 14);
      fields = [
        { key: 'legalName', value: label + ' Ltd.', type: 'string' },
        { key: 'ticker', value: label.slice(0, 3).toUpperCase() + (100 + i), type: 'string' },
        { key: 'founded', value: `${founded}-01-15`, type: 'date' },
        { key: 'employees', value: 10 + (i % 5000), type: 'number' },
        { key: 'revenue', value: (1 + (i % 500)) * 1000000, type: 'number' },
        { key: 'valuation', value: (10 + (i % 5000)) * 1000000, type: 'number' },
        { key: 'headquarters', value: pick(CITIES, i + 4), type: 'geo' },
        { key: 'website', value: `https://${label.toLowerCase().replace(/\s/g, '')}.io`, type: 'url' },
        { key: 'isPublic', value: i % 4 === 0, type: 'boolean' },
        { key: 'sector', value: 'Graph Technology', type: 'string' },
        { key: 'offices', value: pickN(CITIES, 2 + (i % 5), i), type: 'array' },
        { key: 'techStack', value: pickN(SKILLS_POOL, 4, i + 2), type: 'array' },
        { key: 'ein', value: `${70 + (i % 30)}-${String(1000000 + i).slice(0, 7)}`, type: 'string' },
        { key: 'duns', value: `${10 + (i % 90)}-${String(100 + i).padStart(3, '0')}-${String(1000 + i).padStart(4, '0')}`, type: 'string' },
        { key: 'seriesStage', value: pick(['Seed', 'Series A', 'Series B', 'Series C', 'Public', 'Bootstrapped'], i), type: 'string' },
        { key: 'metadata', value: `{"growth":"${10 + (i % 200)}%","nps":${30 + (i % 70)},"churn":${(i % 15) / 10}}`, type: 'json' },
      ];
    } else if (type === 'Product') {
      label = pick(PRODUCT_NAMES, i + 1) + (i > PRODUCT_NAMES.length ? ` v${1 + Math.floor(i / PRODUCT_NAMES.length)}` : '');
      fields = [
        { key: 'productName', value: label, type: 'string' },
        { key: 'version', value: `${1 + (i % 8)}.${i % 12}.${i % 20}`, type: 'string' },
        { key: 'releaseDate', value: fakeDate(i + 100), type: 'date' },
        { key: 'license', value: pick(['OSS', 'Enterprise', 'Freemium', 'MIT', 'Apache 2.0'], i), type: 'string' },
        { key: 'monthlyPrice', value: (i % 10) * 500, type: 'number' },
        { key: 'activeUsers', value: 100 + (i % 100000), type: 'number' },
        { key: 'uptime', value: parseFloat((99 + (i % 100) / 1000).toFixed(3)), type: 'number' },
        { key: 'docsUrl', value: `https://docs.graphcorp.io/${label.toLowerCase().replace(/\s/g, '-')}`, type: 'url' },
        { key: 'features', value: pickN(['GraphQL API', 'Cypher', 'REST', 'gRPC', 'ACID', 'Multi-model', 'Auth', 'RBAC'], 3 + (i % 4), i), type: 'array' },
        { key: 'isDeprecated', value: i % 12 === 0, type: 'boolean' },
        { key: 'avgQueryMs', value: parseFloat((1 + (i % 100) / 10).toFixed(1)), type: 'number' },
        { key: 'slaDays', value: [30, 90, 180, 365][i % 4]!, type: 'number' },
        { key: 'metadata', value: `{"category":"${pick(['OLTP', 'OLAP', 'Streaming', 'Batch'], i)}","support":"${pick(['24/7', 'Business hours', 'Community'], i)}"}`, type: 'json' },
      ];
    } else if (type === 'Document') {
      label = `${pick(DOC_TITLES, i)} #${100 + i}`;
      fields = [
        { key: 'title', value: label, type: 'string' },
        { key: 'docId', value: `DOC-${2020 + (i % 7)}-${String(i).padStart(4, '0')}`, type: 'string' },
        { key: 'status', value: pick(['Published', 'Working Draft', 'Review', 'Archived'], i), type: 'string' },
        { key: 'publishedDate', value: fakeDate(i + 30), type: 'date' },
        { key: 'pages', value: 12 + (i % 240), type: 'number' },
        { key: 'citationCount', value: 5 + (i % 800), type: 'number' },
        { key: 'isNormative', value: i % 2 === 0, type: 'boolean' },
        { key: 'url', value: `https://specs.graphcorp.io/docs/${100 + i}`, type: 'url' },
        { key: 'metadata', value: `{"format":"PDF+HTML","version":"${1 + (i % 4)}.${i % 9}"}`, type: 'json' },
      ];
    } else if (type === 'Concept') {
      label = `${pick(CONCEPT_NAMES, i)} (${1 + (i % 99)})`;
      fields = [
        { key: 'conceptName', value: label, type: 'string' },
        { key: 'domain', value: pick(['Graph Theory', 'Distributed Systems', 'Semantic Web', 'GNN'], i), type: 'string' },
        { key: 'complexity', value: pick(['O(V + E)', 'O(V log V)', 'O(E^1.5)', 'NP-Hard'], i), type: 'string' },
        { key: 'adoptionYear', value: 1998 + (i % 27), type: 'number' },
        { key: 'citationCount', value: 120 + (i % 9500), type: 'number' },
        { key: 'isIsoStandard', value: i % 3 === 0, type: 'boolean' },
        { key: 'queryLanguages', value: pickN(['Cypher', 'Gremlin', 'SPARQL', 'GQL'], 2 + (i % 3), i), type: 'array' },
        { key: 'metadata', value: `{"maturity":"stable","paradigm":"declarative"}`, type: 'json' },
      ];
    } else {
      label = `${pick(['Graph Summit', 'NodeConf', 'DataMesh Forum', 'KG World', 'GraphConnect'], i)} ${2022 + (i % 5)} #${i}`;
      fields = [
        { key: 'eventName', value: label, type: 'string' },
        { key: 'startDate', value: fakeDate(i + 50), type: 'date' },
        { key: 'venue', value: `${pick(['Convention Center', 'Expo Hall', 'Forum Center'], i)}, ${pick(CITIES, i)}`, type: 'geo' },
        { key: 'attendees', value: 100 + (i % 5000), type: 'number' },
        { key: 'speakers', value: 5 + (i % 100), type: 'number' },
        { key: 'ticketPrice', value: 200 + (i % 2000), type: 'number' },
        { key: 'format', value: pick(['In-person', 'Virtual', 'Hybrid'], i), type: 'string' },
        { key: 'tracks', value: pickN(['Graph ML', 'Enterprise', 'Open Source', 'KG', 'Security', 'Research'], 2 + (i % 4), i), type: 'array' },
        { key: 'isVirtual', value: i % 3 === 2, type: 'boolean' },
        { key: 'metadata', value: `{"soldOut":${i % 7 === 0},"cfpOpen":${i % 5 !== 0}}`, type: 'json' },
      ];
    }

    rows.push({
      id: `row-${i}`,
      index: i,
      entityId: `e${String(i + 1).padStart(4, '0')}`,
      label,
      type,
      color,
      fields,
      connectedCount: 1 + (i % 12),
      fieldCount: fields.length,
      author,
      updatedAt: `2026-${String(1 + (i % 9)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
      imageUrl: type === 'Person' && i % 5 < images.length ? images[i % 5] : undefined,
    });
  }

  return rows;
}