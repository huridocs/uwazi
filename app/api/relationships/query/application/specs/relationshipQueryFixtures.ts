import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import type { DBFixture } from '#api/utils/testing_db.js';

const factory = getFixturesFactory();
const id = (name: string) => factory.id(name);

const enRect1 = { top: 1, left: 2, width: 3, height: 4, page: '1' };
const enRect2 = { top: 10, left: 20, width: 30, height: 40, page: '2' };
const esRect = { top: 5, left: 6, width: 7, height: 8, page: '3' };
const targetRect = { top: 9, left: 8, width: 7, height: 6, page: '4' };

const bilingual = (sharedId: string, titles: { en: string; es: string }) =>
  factory.entityInMultipleLanguages(
    ['en', 'es'],
    sharedId,
    'tmpl',
    {},
    { published: true },
    { en: { title: titles.en }, es: { title: titles.es } }
  );

const entity = (
  sharedId: string,
  extras: {
    title: string;
    published?: boolean;
    permissions?: ReturnType<typeof factory.entityPermission>[];
  }
) =>
  factory.entity(
    sharedId,
    'tmpl',
    {},
    { language: 'en', published: extras.published ?? true, ...extras }
  );

const conn = (
  name: string,
  hub: string,
  entitySharedId: string,
  extras: {
    template?: ReturnType<typeof id> | null;
    file?: string;
    text?: string;
    rects?: (typeof enRect1)[];
  } = {}
) => ({
  _id: id(name),
  hub: id(hub),
  entity: entitySharedId,
  template: extras.template ?? null,
  ...(extras.file ? { file: id(extras.file) } : {}),
  ...(extras.text
    ? { reference: { text: extras.text, selectionRectangles: extras.rects ?? [] } }
    : {}),
});

const rel1 = id('rel1');

const relationshipQueryFixtures: DBFixture = {
  settings: [
    {
      languages: [
        { key: 'en', label: 'English', default: true },
        { key: 'es', label: 'Spanish' },
      ],
    },
  ],
  templates: [factory.template('tmpl')],
  relationtypes: [factory.relationType('rel1')],
  entities: [
    ...bilingual('source', { en: 'Source EN', es: 'Source ES' }),
    ...bilingual('target', { en: 'Target EN', es: 'Target ES' }),
    entity('secret', { title: 'Secret', published: false }),
    entity('hidden', { title: 'Hidden', published: false }),
    entity('collabdoc', {
      title: 'Collab Doc',
      published: false,
      permissions: [factory.entityPermission('collab', 'user', 'read')],
    }),
    entity('collabTarget', { title: 'Collab Target' }),
    entity('lonely', { title: 'Lonely' }),
    entity('orphan', { title: 'Orphan' }),
    entity('fileOnly', { title: 'File Only' }),
    entity('peerA', { title: 'Peer A' }),
    entity('peerB', { title: 'Peer B' }),
    factory.entity(
      'notmpl',
      undefined,
      {},
      { language: 'en', published: true, title: 'No Template' }
    ),
  ],
  files: [
    factory.document('source-en', { entity: 'source', language: 'en' }),
    factory.document('source-es', { entity: 'source', language: 'es' }),
    factory.document('target-en', { entity: 'target', language: 'en' }),
    factory.document('fileOnly-es', { entity: 'fileOnly', language: 'es' }),
  ],
  connections: [
    conn('hubMain-source', 'hubMain', 'source'),
    conn('hubMain-source-en', 'hubMain', 'source', {
      file: 'source-en',
      text: 'en quote',
      rects: [enRect1, enRect2],
    }),
    conn('hubMain-source-es', 'hubMain', 'source', {
      file: 'source-es',
      text: 'es quote',
      rects: [esRect],
    }),
    conn('hubMain-target', 'hubMain', 'target', { template: rel1 }),
    conn('hubMain-target-en', 'hubMain', 'target', {
      template: rel1,
      file: 'target-en',
      text: 'target quote',
      rects: [targetRect],
    }),
    conn('hubMain-notmpl', 'hubMain', 'notmpl', { template: rel1 }),
    conn('hubSecret-source', 'hubSecret', 'source'),
    conn('hubSecret-secret', 'hubSecret', 'secret', { template: rel1 }),
    conn('hubHidden-hidden', 'hubHidden', 'hidden'),
    conn('hubHidden-target', 'hubHidden', 'target', { template: rel1 }),
    conn('hubCollab-doc', 'hubCollab', 'collabdoc'),
    conn('hubCollab-target', 'hubCollab', 'collabTarget', { template: rel1 }),
    conn('hubLonely-lonely', 'hubLonely', 'lonely'),
    conn('hubOrphan-fileOnly', 'hubOrphan', 'fileOnly', {
      file: 'fileOnly-es',
      text: 'fileOnly quote',
      rects: [enRect1],
    }),
    conn('hubOrphan-peerA', 'hubOrphan', 'peerA', { template: rel1 }),
    conn('hubOrphan-peerB', 'hubOrphan', 'peerB', { template: rel1 }),
  ],
};

export { enRect1, enRect2, id, relationshipQueryFixtures, targetRect };
