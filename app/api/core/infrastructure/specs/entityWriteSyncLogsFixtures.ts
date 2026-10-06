import { Entity } from '#api/core/domain/entity/Entity.js';
import { TemplateBuilder } from '#api/core/domain/template/specs/TemplateBuilder.js';
import { TextProperty } from '#api/core/domain/template/TextProperty.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { LanguageISO6391 } from '#shared/types/commonTypes.js';

const factory = getFixturesFactory();
const ORIGINAL = 100;

const entityWriteFixtures = () => ({
  settings: [
    {
      languages: [
        { default: true, key: 'en' as const, label: 'English' },
        { key: 'es' as const, label: 'Spanish' },
      ],
    },
  ],
  templates: [
    factory.template('t1', [factory.property('text', 'text'), factory.relationshipProp('rel')]),
  ],
  entities: [
    ...factory.entityInMultipleLanguages(
      ['en', 'es'],
      'entity1',
      't1',
      {
        text: [{ value: 'hello' }],
        rel: [
          { value: 'gone', label: 'Gone' },
          { value: 'keep', label: 'Keep' },
        ],
      },
      { published: true }
    ),
    factory.entity(
      'entity2',
      't1',
      { rel: [{ value: 'keep', label: 'Keep' }] },
      { published: true }
    ),
  ],
  files: [
    factory.document('doc1', { entity: 'entity1' }),
    factory.attachment('att1', { entity: 'entity1' }),
    factory.file('thumb1', { type: 'thumbnail', entity: 'entity1' }),
    factory.document('held1', { entity: 'entity1' }),
    factory.document('unlogged1', { entity: 'entity1' }),
    factory.document('doc2', { entity: 'entity2' }),
    factory.custom_upload('custom1'),
    factory.document('fresh-doc', { entity: 'fresh' }),
  ],
  updatelogs: [
    factory.updatelog('entities', 'entity1-en', false, ORIGINAL),
    factory.updatelog('entities', 'entity1-es', false, ORIGINAL),
    factory.updatelog('entities', 'entity2-en', false, ORIGINAL),
    factory.updatelog('files', 'doc1', false, ORIGINAL),
    factory.updatelog('files', 'att1', false, ORIGINAL),
    factory.updatelog('files', 'thumb1', false, ORIGINAL),
    factory.updatelog('files', 'held1', true, ORIGINAL),
    factory.updatelog('files', 'doc2', false, ORIGINAL),
    factory.updatelog('files', 'custom1', false, ORIGINAL),
    factory.updatelog('files', 'fresh-doc', false, ORIGINAL),
  ],
});

type LogRow = { namespace: string; mongoId: string; deleted: boolean; timestamp: number };

const logRows = async (): Promise<LogRow[]> => {
  const logs = await testingEnvironment.db.getAllFrom('updatelogs');
  return logs.map(log => ({
    namespace: log.namespace as string,
    mongoId: log.mongoId.toString(),
    deleted: log.deleted as boolean,
    timestamp: log.timestamp as number,
  }));
};

const findLog = (rows: LogRow[], namespace: string, key: string) =>
  rows.find(row => row.namespace === namespace && row.mongoId === factory.idString(key));

const expectRefreshed = (row: LogRow | undefined) => {
  expect(row?.deleted).toBe(false);
  expect(row?.timestamp).toBeGreaterThan(ORIGINAL);
};

const expectHeld = (row: LogRow | undefined, deleted = false) => {
  expect(row).toEqual({
    namespace: row?.namespace,
    mongoId: row?.mongoId,
    deleted,
    timestamp: ORIGINAL,
  });
};

const entity1Files = ['doc1', 'att1', 'thumb1', 'held1', 'unlogged1'];

const expectEntity1FilesRefreshed = (rows: LogRow[]) => {
  entity1Files.forEach(id => expectRefreshed(findLog(rows, 'files', id)));
  ['doc2', 'custom1', 'fresh-doc'].forEach(id => expectHeld(findLog(rows, 'files', id)));
};

const expectNoFileRefresh = (rows: LogRow[]) => {
  ['doc1', 'att1', 'thumb1', 'doc2', 'custom1', 'fresh-doc'].forEach(id =>
    expectHeld(findLog(rows, 'files', id))
  );
  expectHeld(findLog(rows, 'files', 'held1'), true);
  expect(findLog(rows, 'files', 'unlogged1')).toBeUndefined();
};

const expectEntityLogsRefreshed = (rows: LogRow[], keys: string[]) => {
  keys.forEach(key => expectRefreshed(findLog(rows, 'entities', key)));
};

const entityFor = (sharedId: string, languages: LanguageISO6391[]) => {
  const template = TemplateBuilder.aTemplate({ id: factory.idString('t1'), name: 't1' })
    .withProperties([
      new TextProperty({ id: 'text', template: factory.idString('t1'), label: 'Text' }),
    ])
    .build();
  const entity = new Entity({
    sharedId,
    template,
    translations: languages.map(language => ({
      language,
      id: factory.idString(`${sharedId}-${language}`),
    })),
  });
  const textProperty = template.properties.find(
    property => property.name === 'text'
  ) as TextProperty;
  entity.setPropertyAssignmentsInAllLanguages([
    template.createPropertyAssignment('title', { value: [{ value: `Entity ${sharedId}` }] }),
    textProperty.createPropertyAssignment({ value: [{ value: 'New Text' }] }),
  ]);
  return { entity, textProperty };
};

const idOf = (value: { toString(): string } | string) =>
  typeof value === 'string' ? value : value.toString();

export {
  entity1Files,
  entityFor,
  entityWriteFixtures,
  expectEntity1FilesRefreshed,
  expectEntityLogsRefreshed,
  expectHeld,
  expectNoFileRefresh,
  expectRefreshed,
  findLog,
  idOf,
  logRows,
  ORIGINAL,
};
