/**
 * Synthetic corpus generator.
 *
 * Three axes, because they stress different things and only the first is
 * obvious:
 *   --entities     E  corpus size
 *   --properties   P  filler properties per entity; drives the length of the
 *                     OR-fan a bare text search has to emit (tradeoffs §I.2)
 *   --cardinality  C  distinct values per faceted property; drives facet
 *                     bucket count against preloadOptionsSearch() = 2000
 *
 * On top of the filler, every entity carries a fixed set of `probe_*`
 * properties with deterministic values, so probe assertions can be exact
 * rather than statistical. Shapes copied from
 * app/api/search/specs/fixtures_elastic.js so we are indexing what Uwazi
 * actually writes, not an idealised version of it.
 */
import { connectAdmin, TENANT } from '../lib/db.mjs';

const BATCH = 500;

// Deterministic PRNG (a plain linear congruential generator -- no bitwise ops,
// which the repo lint bans). Reruns produce identical corpora, so a plan change
// between runs is a real change and not sampling noise.
const MODULUS = 4294967296;
const lcg = seed => {
  let state = seed % MODULUS;
  return () => {
    state = (state * 1664525 + 1013904223) % MODULUS;
    return state / MODULUS;
  };
};

const WORDS = ['guatemala', 'honduras', 'ruling', 'tribunal', 'testimony', 'archive', 'juris'];

// The four values that expose lexicographic sorting of numerics: sorted as
// text they come back 100, 1000, 25, 9.
const NUMBERS = [9, 25, 100, 1000];

const TEMPLATES = ['tpl_report', 'tpl_case', 'tpl_person'];

const buildMetadata = (i, rand, P, C) => {
  const metadata = {};

  // --- deterministic probe properties -------------------------------------

  metadata.probe_text = [{ value: `${WORDS[i % WORDS.length]} document ${i}` }];
  metadata.probe_number = [{ value: NUMBERS[i % NUMBERS.length] }];
  metadata.probe_date = [{ value: 1500000000 + i * 86400 }];
  metadata.probe_daterange = [
    { value: { from: 1500000000 + i * 86400, to: 1500000000 + (i + 30) * 86400 } },
  ];

  // select with a thesaurus parent -- the `parent` subtree is what
  // selectAggregation() counts separately from `self`, and it is the row the
  // assessment's feature table does not mention.
  const country = `country_${i % C}`;
  const region = `region_${i % 4}`;
  metadata.probe_select = [
    { value: country, label: country, parent: { value: region, label: region } },
  ];

  // multi-valued: an entity legitimately tagged with several values at once.
  // This is the shape the "counts are correct for multi-valued properties"
  // claim rests on.
  metadata.probe_multi = [
    { value: `tag_${i % C}`, label: `tag_${i % C}` },
    { value: `tag_${(i + 1) % C}`, label: `tag_${(i + 1) % C}` },
  ];

  // nested: one array element == one nested row. Arranged so that strict and
  // non-strict semantics MUST disagree -- (personA, roleX) and (personB, roleY)
  // exist, but (personA, roleY) does not.
  metadata.probe_nested = [
    { value: { person: [`person_${i % 5}`], role: [`role_${i % 3}`] } },
    { value: { person: [`person_${(i + 1) % 5}`], role: [`role_${(i + 1) % 3}`] } },
  ];

  // Every 7th entity omits probe_select entirely, to exercise the `missing`
  // bucket and the "No label" option.
  if (i % 7 === 0) {
    delete metadata.probe_select;
  }

  // --- filler, to inflate the property count ------------------------------

  for (let p = 0; p < P; p += 1) {
    metadata[`filler_${p}`] = [
      { value: `${WORDS[Math.floor(rand() * WORDS.length)]}_${p}_${i % C}` },
    ];
  }

  return metadata;
};

const buildRow = (i, rand, P, C) => {
  // A third of the corpus is unpublished and shared with collab1, so the
  // collaborator actor sees a mix of both RLS branches rather than everything
  // through `published = true`.
  const published = i % 3 !== 0;
  const permissions = published ? [] : [{ refId: 'collab1', type: 'user', level: 'read' }];

  return [
    `id_${String(i).padStart(9, '0')}`,
    TENANT,
    `shared_${i}`,
    'en',
    `${WORDS[i % WORDS.length]} title ${i}`,
    TEMPLATES[i % TEMPLATES.length],
    published,
    1500000000 + i,
    1500000000 + i,
    JSON.stringify(buildMetadata(i, rand, P, C)),
    JSON.stringify(permissions),
  ];
};

const COLUMNS = [
  '_id',
  'tenant_id',
  '"sharedId"',
  'language',
  'title',
  'template',
  'published',
  '"creationDate"',
  '"editDate"',
  'metadata',
  'permissions',
];

const seedCorpus = async ({ E, P, C }) => {
  const client = await connectAdmin();
  const rand = lcg(42);

  console.log(`seeding E=${E} P=${P} C=${C} into ${TENANT}`);
  await client.query('TRUNCATE entities');

  const started = Date.now();
  for (let offset = 0; offset < E; offset += BATCH) {
    const size = Math.min(BATCH, E - offset);
    const rows = [];
    const values = [];
    for (let n = 0; n < size; n += 1) {
      const row = buildRow(offset + n, rand, P, C);
      const base = n * COLUMNS.length;
      rows.push(`(${row.map((_, c) => `$${base + c + 1}`).join(',')})`);
      values.push(...row);
    }
    await client.query(
      `INSERT INTO entities (${COLUMNS.join(',')}) VALUES ${rows.join(',')}`,
      values
    );
    if (offset % 10000 === 0 && offset > 0) console.log(`  ${offset}/${E}`);
  }

  const {
    rows: [{ count }],
  } = await client.query('SELECT count(*)::int AS count FROM entities');
  console.log(`seeded ${count} rows in ${((Date.now() - started) / 1000).toFixed(1)}s`);
  await client.end();
  return count;
};

const isEntryPoint = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());

if (isEntryPoint) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );
  seedCorpus({
    E: Number(args.entities ?? 1000),
    P: Number(args.properties ?? 20),
    C: Number(args.cardinality ?? 50),
  }).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

export { seedCorpus };
