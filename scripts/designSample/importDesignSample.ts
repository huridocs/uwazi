import { createHash, randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { ObjectId } from 'mongodb';
import path from 'path';
import { fileURLToPath } from 'url';

import { DB } from '#api/odm/index.js';
import { config } from '#api/config.js';
import { safeName } from '#api/core/domain/template/utils/propertyNameGeneration.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

type Sample = {
  entityTypes: { id: string; name: string; color: string }[];
  baseEntities: { id: string; title: string; typeId: string }[];
  seedThesauri: { id: string; name: string }[];
  seedThesaurusItems: Record<string, string[]>;
  seedRelationTypes: { id: string; name: string }[];
  templatePropertiesByTemplate: Record<
    string,
    { id: string; label: string; type: string; required: boolean; filterable: boolean }[]
  >;
  defaultTemplateProperties: {
    id: string;
    label: string;
    type: string;
    required: boolean;
    filterable: boolean;
  }[];
  seedLanguages: { key: string; label: string; localizedLabel: string; ltr: boolean; default: boolean }[];
  seedPages: { id: string; title: string; slug: string; published: boolean }[];
  baseProps: Record<string, Record<string, string>>;
  references: {
    id: string;
    sourceEntityId: string;
    targetEntityId: string;
    relationType: string;
    hubId?: string;
  }[];
  relationTypes: { id: string; label: string }[];
};

const META_TO_LABEL: Record<string, Record<string, string>> = {
  person: {
    country: 'Nationality',
    role: 'Role',
    profession: 'Profession',
    born: 'Date of birth',
  },
  country: {
    region: 'Region',
    achrRatified: 'ACHR ratified',
    courtJurisdiction: 'Court jurisdiction',
  },
  court_case: {
    caseNumber: 'Case number',
    dateFiled: 'Date filed',
    respondent: 'Respondent state',
    status: 'Status',
    country: 'Country',
    region: 'Region',
  },
  right: {
    instrument: 'Instrument',
    article: 'Article',
    category: 'Category',
  },
  judgment: {
    date: 'Date',
    court: 'Court',
    series: 'Series',
    outcome: 'Outcome',
  },
  organization: {
    orgType: 'Type',
    founded: 'Founded',
    headquarters: 'Headquarters',
  },
  violation: {
    category: 'Category',
    relatedRight: 'Related right',
    definition: 'Definition',
  },
  document: {
    docType: 'Document type',
    adopted: 'Adopted',
    source: 'Source',
  },
};

const hash = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (Math.imul(h, 131) + s.charCodeAt(i)) >>> 0;
  return h;
};

const oidFrom = (seed: string) =>
  ObjectId.createFromHexString(createHash('md5').update(seed).digest('hex').slice(0, 24));

const dateEpoch = (raw: string): number | undefined => {
  if (/^\d{4}$/.test(raw)) return Math.floor(Date.UTC(Number(raw), 0, 1) / 1000);
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return Math.floor(Date.parse(raw) / 1000);
  return undefined;
};

const start = async () => {
  const databaseName = process.env.DATABASE_NAME || 'uwazi_design';
  await DB.connect(config.DBHOST, config.DBAUTH);
  const db = DB.mongodb_Db(databaseName);

  const sample: Sample = JSON.parse(
    readFileSync(path.join(__dirname, 'sample.json'), 'utf8')
  ) as Sample;

  const admin = await db.collection('users').findOne({ role: 'admin' });
  if (!admin) throw new Error('No admin user in ' + databaseName);

  await Promise.all(
    ['templates', 'dictionaries', 'relationtypes', 'entities', 'connections', 'pages'].map(c =>
      db.collection(c).deleteMany({})
    )
  );

  const thesaurusByProto = new Map<string, ObjectId>();
  const thesaurusValueId = new Map<string, string>();
  const dictionaries = sample.seedThesauri.map(t => {
    const _id = oidFrom(`dict:${t.id}`);
    thesaurusByProto.set(t.id, _id);
    const values = (sample.seedThesaurusItems[t.id] || []).map(label => {
      const id = randomUUID();
      thesaurusValueId.set(`${t.id}::${label}`, id);
      return { id, label };
    });
    return { _id, name: t.name, values };
  });
  await db.collection('dictionaries').insertMany(dictionaries);

  const relByKey = new Map<string, ObjectId>();
  for (const r of sample.seedRelationTypes) {
    relByKey.set(r.name.toLowerCase().replace(/\s+/g, '_'), oidFrom(`rel:${r.id}`));
    relByKey.set(r.id, oidFrom(`rel:${r.id}`));
  }
  for (const r of sample.relationTypes) {
    if (!relByKey.has(r.id)) relByKey.set(r.id, oidFrom(`rel:${r.id}`));
  }
  const relationtypes = [...new Map(
    [...relByKey.entries()].map(([, id]) => [id.toHexString(), id])
  ).values()].map(_id => {
    const match =
      sample.seedRelationTypes.find(r => oidFrom(`rel:${r.id}`).equals(_id)) ||
      sample.relationTypes.find(r => oidFrom(`rel:${r.id}`).equals(_id));
    const name =
      (match && 'name' in match ? match.name : undefined) ||
      (match && 'label' in match ? match.label : undefined) ||
      'Related';
    return { _id, name, properties: [] as unknown[] };
  });
  await db.collection('relationtypes').insertMany(relationtypes);

  const statusDict = thesaurusByProto.get('t3');
  const countryTemplateId = oidFrom('tpl:country');

  const templates = sample.entityTypes.map((type, index) => {
    const _id = oidFrom(`tpl:${type.id}`);
    const editorProps =
      sample.templatePropertiesByTemplate[type.id] ||
      sample.defaultTemplateProperties.filter(p => p.label !== 'Title');

    const metaMap = META_TO_LABEL[type.id] || {};
    const byLabel = new Map<string, { label: string; type: string }>();
    for (const p of editorProps) byLabel.set(p.label, { label: p.label, type: p.type });
    for (const [metaKey, label] of Object.entries(metaMap)) {
      if (!byLabel.has(label)) {
        const hint = editorProps.find(p => p.label === label)?.type;
        byLabel.set(label, {
          label,
          type:
            hint ||
            (metaKey === 'status' ? 'select' : metaKey.includes('date') || metaKey === 'born' || metaKey === 'date' || metaKey === 'founded' || metaKey === 'adopted' || metaKey === 'dateFiled' ? 'date' : metaKey === 'definition' || metaKey === 'summary' ? 'markdown' : metaKey === 'respondent' || metaKey === 'country' || label === 'Nationality' || label === 'Respondent state' ? 'relationship' : 'text'),
        });
      }
    }

    const properties = [...byLabel.values()].map(p => {
      const propId = oidFrom(`prop:${type.id}:${p.label}`);
      const name = safeName(p.label, true);
      const prop: Record<string, unknown> = {
        _id: propId,
        label: p.label,
        name,
        type: p.type === 'numeric' ? 'numeric' : p.type,
        filter: p.type === 'select' || p.type === 'relationship' || p.type === 'date',
      };
      if (p.type === 'select' && p.label === 'Status' && statusDict) {
        prop.content = statusDict.toHexString();
      }
      if (p.type === 'relationship') {
        prop.content = countryTemplateId.toHexString();
        const mentions = relByKey.get('relates_to') || relByKey.get('r2');
        prop.relationType = (mentions || [...relByKey.values()][0]).toHexString();
      }
      return prop;
    });

    return {
      _id,
      name: type.name,
      color: type.color,
      default: type.id === 'court_case' || (index === 0 && !sample.entityTypes.some(t => t.id === 'court_case')),
      commonProperties: [
        {
          _id: oidFrom(`cprop:${type.id}:title`),
          label: 'Title',
          name: 'title',
          type: 'text',
          isCommonProperty: true,
        },
        {
          _id: oidFrom(`cprop:${type.id}:creationDate`),
          label: 'Date added',
          name: 'creationDate',
          type: 'date',
          isCommonProperty: true,
        },
        {
          _id: oidFrom(`cprop:${type.id}:editDate`),
          label: 'Date modified',
          name: 'editDate',
          type: 'date',
          isCommonProperty: true,
        },
      ],
      properties,
    };
  });
  await db.collection('templates').insertMany(templates);

  const templateByType = new Map(sample.entityTypes.map(t => [t.id, oidFrom(`tpl:${t.id}`)]));
  const entityById = new Map(sample.baseEntities.map(e => [e.id, e]));
  const countrySharedByTitle = new Map(
    sample.baseEntities.filter(e => e.typeId === 'country').map(e => [e.title.toLowerCase(), e.id])
  );

  const now = Date.now();
  const entities = sample.baseEntities.map(e => {
    const createdAt = new Date(Date.UTC(2024, 5, 30) - (hash(e.id) % 540) * 86_400_000);
    const published = hash(`${e.id}·pub`) % 5 !== 0;
    const tplId = templateByType.get(e.typeId)!;
    const tpl = templates.find(t => t._id.equals(tplId))!;
    const metaRaw = sample.baseProps[e.id] || {};
    const metaMap = META_TO_LABEL[e.typeId] || {};
    const metadata: Record<string, { value: unknown; label?: string; type?: string }[]> = {};

    for (const [metaKey, value] of Object.entries(metaRaw)) {
      const label = metaMap[metaKey] || metaKey;
      const prop = tpl.properties.find(p => p.label === label);
      if (!prop) continue;
      const name = String(prop.name);
      if (prop.type === 'select' && prop.content) {
        const valueId = thesaurusValueId.get(`t3::${value}`);
        if (valueId) metadata[name] = [{ value: valueId, label: value }];
        continue;
      }
      if (prop.type === 'relationship') {
        const sid = countrySharedByTitle.get(value.toLowerCase());
        if (sid) metadata[name] = [{ value: sid, label: value, type: 'entity' }];
        continue;
      }
      if (prop.type === 'date') {
        const epoch = dateEpoch(value);
        if (epoch !== undefined) metadata[name] = [{ value: epoch }];
        else metadata[name] = [{ value }];
        continue;
      }
      metadata[name] = [{ value }];
    }

    return {
      _id: oidFrom(`ent:${e.id}:en`),
      language: 'en',
      sharedId: e.id,
      template: tplId,
      title: e.title,
      published,
      creationDate: createdAt.getTime(),
      editDate: now,
      user: admin._id,
      icon: { _id: null, type: 'Empty' },
      permissions: [{ refId: String(admin._id), type: 'user', level: 'write' }],
      metadata,
      obsoleteMetadata: [],
    };
  });
  await db.collection('entities').insertMany(entities);

  const relIdFor = (key: string) =>
    relByKey.get(key) ||
    relByKey.get(key.replace(/_/g, ' ')) ||
    [...relByKey.values()][0];

  const hubs = new Map<string, ObjectId>();
  const connections: Record<string, unknown>[] = [];
  for (const ref of sample.references) {
    if (!entityById.has(ref.sourceEntityId) || !entityById.has(ref.targetEntityId)) continue;
    const hubKey = ref.hubId || `pair:${ref.sourceEntityId}:${ref.targetEntityId}:${ref.relationType}`;
    let hub = hubs.get(hubKey);
    if (!hub) {
      hub = oidFrom(`hub:${hubKey}`);
      hubs.set(hubKey, hub);
    }
    const template = relIdFor(ref.relationType);
    connections.push(
      {
        _id: oidFrom(`conn:${ref.id}:from`),
        entity: ref.sourceEntityId,
        hub,
        template,
      },
      {
        _id: oidFrom(`conn:${ref.id}:to`),
        entity: ref.targetEntityId,
        hub,
        template: null,
      }
    );
  }
  const uniqueConnections = [
    ...new Map(connections.map(c => [String(c._id), c])).values(),
  ];
  if (uniqueConnections.length) await db.collection('connections').insertMany(uniqueConnections);

  if (sample.seedPages.length) {
    await db.collection('pages').insertMany(
      sample.seedPages.map(p => ({
        _id: oidFrom(`page:${p.id}`),
        title: p.title,
        sharedId: p.slug,
        language: 'en',
        metadata: { content: [{ value: `<p>${p.title}</p>` }] },
        creationDate: now,
        editDate: now,
      }))
    );
  }

  const languages = sample.seedLanguages.map(l => ({
    key: l.key,
    label: l.label,
    localized_label: l.localizedLabel,
    rtl: !l.ltr,
    default: l.default,
  }));
  await db.collection('settings').updateOne(
    {},
    {
      $set: {
        site_name: 'Uwazi Design Sample',
        languages,
        filters: sample.entityTypes.map(t => ({
          id: oidFrom(`tpl:${t.id}`).toHexString(),
          name: t.name,
        })),
      },
    }
  );

  console.log(
    JSON.stringify({
      database: databaseName,
      templates: templates.length,
      dictionaries: dictionaries.length,
      relationtypes: relationtypes.length,
      entities: entities.length,
      connections: uniqueConnections.length,
      pages: sample.seedPages.length,
    })
  );

  await DB.disconnect();
};

start().catch(async err => {
  console.error(err);
  try {
    await DB.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
