/**
 * Full-text corpus generator: one row per (file, page).
 *
 * Dials:
 *   --pages          total pages across the corpus
 *   --pagesPerFile   pages in each document (default 20)
 *   --filesPerEntity how many PDFs hang off one entity (default 2) -- every one
 *                    of them is indexed, which is the behaviour change we are
 *                    testing for
 *   --languages      how many distinct languages the corpus spans
 *
 * Text is built from a per-language vocabulary with real inflected forms, so
 * stemming probes can assert that a base form finds an inflected one rather
 * than just asserting "some rows came back".
 */
import { connectAdmin } from '../lib/db.mjs';
import { STEMMERS } from '../lib/fulltextSchema.mjs';

const BATCH = 500;

// Base form -> forms that appear in the text. A probe searching the base form
// must find pages containing only the inflected ones.
const VOCAB = {
  english: [
    'investigation',
    'investigations',
    'investigated',
    'massacre',
    'massacres',
    'witness',
    'witnesses',
    'tribunal',
    'ruling',
    'rulings',
  ],
  spanish: [
    'investigacion',
    'investigaciones',
    'investigado',
    'masacre',
    'masacres',
    'testigo',
    'testigos',
    'tribunal',
    'sentencia',
    'sentencias',
  ],
  french: [
    'enquete',
    'enquetes',
    'massacre',
    'massacres',
    'temoin',
    'temoins',
    'tribunal',
    'jugement',
    'jugements',
    'victime',
  ],
  german: [
    'untersuchung',
    'untersuchungen',
    'massaker',
    'zeuge',
    'zeugen',
    'gericht',
    'urteil',
    'urteile',
    'opfer',
    'gewalt',
  ],
  russian: [
    'расследование',
    'расследования',
    'убийство',
    'убийства',
    'свидетель',
    'свидетели',
    'суд',
    'приговор',
    'жертва',
    'насилие',
  ],
  arabic: ['تحقيق', 'تحقيقات', 'مجزرة', 'شاهد', 'شهود', 'محكمة', 'حكم', 'ضحية', 'عنف', 'انتهاك'],
};
// Anything without a curated vocabulary reuses the English words; the point of
// those partitions is the tokenizer, not the words.
const vocabFor = lang => VOCAB[lang] ?? VOCAB.english;

// A language with no ParadeDB stemmer -- must land in the DEFAULT partition.
const UNSTEMMABLE = 'catalan';

const mulberry = seed => {
  let state = seed % 4294967296;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

const seedFullText = async ({ pages, pagesPerFile = 20, filesPerEntity = 2, languages = 6 }) => {
  const client = await connectAdmin();
  const rand = mulberry(7);

  // Cycle over the languages we have a real inflected vocabulary for -- so the
  // stemming probes assert something meaningful -- plus one unstemmable
  // language so the DEFAULT partition is always exercised.
  const curated = Object.keys(VOCAB).filter(l => STEMMERS.includes(l));
  const extra = STEMMERS.filter(l => !curated.includes(l));
  const langCycle = [...curated, ...extra].slice(0, languages).concat(UNSTEMMABLE);

  console.log(
    `seeding full text: ${pages} pages, ${pagesPerFile}/file, ${filesPerEntity} files/entity, ${langCycle.length} languages`
  );
  await client.query('TRUNCATE entity_fulltext');

  const started = Date.now();
  for (let offset = 0; offset < pages; offset += BATCH) {
    const size = Math.min(BATCH, pages - offset);
    const rows = [];
    const values = [];
    for (let n = 0; n < size; n += 1) {
      const i = offset + n;
      const fileIndex = Math.floor(i / pagesPerFile);
      const language = langCycle[fileIndex % langCycle.length];
      const words = vocabFor(language);
      const contents = Array.from(
        { length: 300 },
        () => words[Math.floor(rand() * words.length)]
      ).join(' ');

      const row = [
        i,
        'tenant_a',
        `shared_${Math.floor(fileIndex / filesPerEntity)}`,
        `file_${fileIndex}`,
        (i % pagesPerFile) + 1,
        language,
        contents,
      ];
      const base = n * 7;
      rows.push(`(${row.map((_, cIdx) => `$${base + cIdx + 1}`).join(',')})`);
      values.push(...row);
    }
    await client.query(
      `INSERT INTO entity_fulltext (id, tenant_id, shared_id, file_id, page, language, contents)
       VALUES ${rows.join(',')}`,
      values
    );
    if (offset % 20000 === 0 && offset > 0) console.log(`  ${offset}/${pages}`);
  }

  const {
    rows: [{ n, files, entities }],
  } = await client.query(
    `SELECT count(*)::int AS n, count(DISTINCT file_id)::int AS files,
            count(DISTINCT shared_id)::int AS entities FROM entity_fulltext`
  );
  console.log(
    `seeded ${n} pages / ${files} files / ${entities} entities in ${((Date.now() - started) / 1000).toFixed(1)}s`
  );
  await client.end();
  return { pages: n, files, entities };
};

const isEntryPoint = process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop());
if (isEntryPoint) {
  const args = Object.fromEntries(
    process.argv.slice(2).map(a => {
      const [k, v] = a.replace(/^--/, '').split('=');
      return [k, v ?? true];
    })
  );
  seedFullText({
    pages: Number(args.pages ?? 20000),
    pagesPerFile: Number(args.pagesPerFile ?? 20),
    filesPerEntity: Number(args.filesPerEntity ?? 2),
    languages: Number(args.languages ?? 6),
  }).catch(e => {
    console.error(e);
    process.exit(1);
  });
}

export { seedFullText, VOCAB, UNSTEMMABLE, vocabFor };
