/* eslint-disable no-await-in-loop */
/* eslint-disable no-continue */
/* eslint-disable import/no-default-export */
import { AnyBulkWriteOperation, Db } from 'mongodb';

const BATCH_SIZE = 1000;

// Inlined from app/shared/language/availableLanguages.ts — migrations are snapshots in time.
const iso3ToIso1: Record<string, string> = {
  abk: 'ab',
  aar: 'aa',
  afr: 'af',
  aka: 'ak',
  sqi: 'sq',
  amh: 'am',
  arb: 'ar',
  arg: 'an',
  hye: 'hy',
  asm: 'as',
  ava: 'av',
  ave: 'ae',
  aym: 'ay',
  aze: 'az',
  bam: 'bm',
  bak: 'ba',
  eus: 'eu',
  bel: 'be',
  ben: 'bn',
  bih: 'bh',
  bis: 'bi',
  bos: 'bs',
  bre: 'br',
  bul: 'bg',
  mya: 'my',
  cat: 'ca',
  cha: 'ch',
  che: 'ce',
  nya: 'ny',
  zho: 'zh',
  'zho-Hans': 'zh-Hans',
  'zho-Hant': 'zh-Hant',
  chv: 'cv',
  cor: 'kw',
  cos: 'co',
  cre: 'cr',
  hrv: 'hr',
  ces: 'cs',
  dan: 'da',
  div: 'dv',
  nld: 'nl',
  dzo: 'dz',
  eng: 'en',
  epo: 'eo',
  est: 'et',
  ewe: 'ee',
  fao: 'fo',
  fij: 'fj',
  fin: 'fi',
  fra: 'fr',
  ful: 'ff',
  glg: 'gl',
  gla: 'gd',
  glv: 'gv',
  kat: 'ka',
  deu: 'de',
  ell: 'el',
  grn: 'gn',
  guj: 'gu',
  hat: 'ht',
  hau: 'ha',
  heb: 'he',
  her: 'hz',
  hin: 'hi',
  hmo: 'ho',
  hun: 'hu',
  isl: 'is',
  ido: 'io',
  ibo: 'ig',
  ind: 'in',
  ina: 'ia',
  ile: 'ie',
  iku: 'iu',
  ipk: 'ik',
  gle: 'ga',
  ita: 'it',
  jpn: 'ja',
  jav: 'jv',
  kal: 'kl',
  kan: 'kn',
  kau: 'kr',
  kas: 'ks',
  kaz: 'kk',
  khm: 'km',
  kik: 'ki',
  kin: 'rw',
  run: 'rn',
  kir: 'ky',
  kom: 'kv',
  kon: 'kg',
  kor: 'ko',
  kur: 'ku',
  kua: 'kj',
  lao: 'lo',
  lat: 'la',
  lav: 'lv',
  lim: 'li',
  lin: 'ln',
  lit: 'lt',
  lub: 'lu',
  lug: 'lg',
  ltz: 'lb',
  mkd: 'mk',
  mlg: 'mg',
  msa: 'ms',
  mal: 'ml',
  mlt: 'mt',
  mri: 'mi',
  mar: 'mr',
  mah: 'mh',
  mon: 'mn',
  nau: 'na',
  nav: 'nv',
  ndo: 'ng',
  nde: 'nd',
  nep: 'ne',
  nor: 'no',
  nob: 'nb',
  nno: 'nn',
  oci: 'oc',
  oji: 'oj',
  chu: 'cu',
  ori: 'or',
  orm: 'om',
  oss: 'os',
  pli: 'pi',
  pus: 'ps',
  fas: 'fa',
  pol: 'pl',
  por: 'pt',
  pan: 'pa',
  que: 'qu',
  roh: 'rm',
  ron: 'ro',
  rus: 'ru',
  sme: 'se',
  smo: 'sm',
  sag: 'sg',
  san: 'sa',
  srp: 'sr',
  hbs: 'sh',
  sot: 'st',
  tsn: 'tn',
  sna: 'sn',
  iii: 'ii',
  snd: 'sd',
  sin: 'si',
  ssw: 'ss',
  slk: 'sk',
  slv: 'sl',
  som: 'so',
  nbl: 'nr',
  spa: 'es',
  sun: 'su',
  swa: 'sw',
  swe: 'sv',
  tgl: 'tl',
  tah: 'ty',
  tgk: 'tg',
  tam: 'ta',
  tat: 'tt',
  tel: 'te',
  tha: 'th',
  bod: 'bo',
  tir: 'ti',
  ton: 'to',
  tso: 'ts',
  tur: 'tr',
  tuk: 'tk',
  twi: 'tw',
  uig: 'ug',
  ukr: 'uk',
  urd: 'ur',
  uzb: 'uz',
  ven: 've',
  vie: 'vi',
  vol: 'vo',
  wln: 'wa',
  cym: 'cy',
  wol: 'wo',
  fry: 'fy',
  xho: 'xh',
  yid: 'yi',
  yor: 'yo',
  zha: 'za',
  zul: 'zu',
};

type EntityDocument = {
  _id: object;
  sharedId: string;
  language: string;
};

type ThumbnailDocument = {
  entity: string;
  language: string;
  filename: string;
};

// Duplicated from Entity.setPreview — migrations are snapshots in time.
function computePreview(
  thumbnails: { language: string; filename: string }[],
  entityLanguage: string,
  defaultLanguage: string
): string | undefined {
  const match =
    thumbnails.find(t => t.language === entityLanguage) ??
    thumbnails.find(t => t.language === defaultLanguage) ??
    thumbnails[0];
  return match?.filename;
}

export default {
  delta: 185,

  reindex: true,

  name: 'set-entity-preview',

  description: 'Backfills entity.preview field from thumbnail files for all entity translations',

  async up(db: Db) {
    process.stdout.write(`${this.name}...\r\n`);

    const settings = await db.collection('settings').findOne({});
    const defaultLanguage: string =
      ((settings?.languages ?? []) as { key: string; default?: boolean }[]).find(l => l.default)
        ?.key ?? 'en';

    const cursor = db
      .collection<EntityDocument>('entities')
      .find({}, { projection: { _id: 1, sharedId: 1, language: 1 } });

    let batch: EntityDocument[] = [];
    let updatedCount = 0;

    const processBatch = async (entities: EntityDocument[]) => {
      const sharedIds = [...new Set(entities.map(e => e.sharedId))];

      const thumbnailDocs = await db
        .collection<ThumbnailDocument>('files')
        .find({ type: 'thumbnail', entity: { $in: sharedIds } })
        .toArray();

      // Group thumbnails by sharedId, converting ISO639_3 → ISO639_1
      const thumbnailsBySharedId: Record<string, { language: string; filename: string }[]> = {};
      for (const t of thumbnailDocs) {
        if (!t.entity || !t.filename) continue;
        const iso1 = iso3ToIso1[t.language] ?? t.language;
        if (!thumbnailsBySharedId[t.entity]) thumbnailsBySharedId[t.entity] = [];
        thumbnailsBySharedId[t.entity].push({ language: iso1, filename: t.filename });
      }

      const operations: AnyBulkWriteOperation[] = [];

      for (const entity of entities) {
        const thumbnails = thumbnailsBySharedId[entity.sharedId] ?? [];
        const preview = computePreview(thumbnails, entity.language, defaultLanguage);

        if (preview) {
          operations.push({
            updateOne: { filter: { _id: entity._id }, update: { $set: { preview } } },
          });
        } else {
          operations.push({
            updateOne: { filter: { _id: entity._id }, update: { $unset: { preview: '' } } },
          });
        }
      }

      if (operations.length) {
        await db.collection('entities').bulkWrite(operations);
        updatedCount += operations.length;
      }
    };

    while (await cursor.hasNext()) {
      const entity = await cursor.next();
      if (!entity) continue;
      batch.push(entity);

      if (batch.length >= BATCH_SIZE) {
        await processBatch(batch);
        batch = [];
      }
    }

    if (batch.length) {
      await processBatch(batch);
    }

    process.stdout.write(`${this.name}: updated ${updatedCount} entities.\r\n`);
  },
};
