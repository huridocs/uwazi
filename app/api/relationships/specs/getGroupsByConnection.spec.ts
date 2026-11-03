import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingDB, DBFixture } from '#api/utils/testing_db.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { User } from '#api/users.v2/model/User.js';
import relationships from '../relationships.js';

const factory = getFixturesFactory();

const entity = (sharedId: string, template: string, published = true) =>
  factory.entity(sharedId, template, {}, { language: 'en', published });

const textReference = (
  hub: string,
  leftEntity: string,
  leftFilename: string | undefined,
  right: { entity: string; template: string | null; filename?: string }
) =>
  factory
    .hub(hub, leftEntity, [{ entity: right.entity, template: right.template }])
    .map((connection, index) => {
      const filename = index === 0 ? leftFilename : right.filename;
      return filename ? { ...connection, filename, file: filename } : connection;
    });

const fixtures: DBFixture = {
  settings: [
    {
      _id: testingDB.id(),
      languages: [
        { key: 'en', label: 'english', default: true },
        { key: 'es', label: 'spanish' },
      ],
    },
  ],
  templates: [factory.template('Case'), factory.template('Court')],
  relationtypes: [factory.relationType('rel1'), factory.relationType('rel2')],
  entities: [
    entity('center', 'Case'),
    entity('a1', 'Case'),
    entity('a2', 'Case'),
    entity('b1', 'Court'),
    entity('unpublished', 'Case', false),
    entity('withEnglishDoc', 'Case'),
    entity('withSpanishDoc', 'Case'),
  ],
  files: [
    factory.document('englishDoc', { entity: 'withEnglishDoc', language: 'en' }),
    factory.document('spanishDoc', { entity: 'withSpanishDoc', language: 'es' }),
    factory.document('centerSpanishDoc', { entity: 'center', language: 'es' }),
  ],
  connections: [
    ...factory.hub('hub1', 'center', [{ entity: 'a1', template: 'rel1' }]),
    ...factory.hub('hub2', 'center', [{ entity: 'a2', template: 'rel1' }]),
    ...factory.hub('hub3', 'center', [{ entity: 'b1', template: 'rel2' }]),
    ...factory.hub('hub4', 'center', [{ entity: 'unpublished', template: 'rel1' }]),
    ...factory.hub('hub5', 'center', [{ entity: 'b1', template: null }]),
    // a text reference to a document in the requested language counts
    ...textReference('hub6', 'center', undefined, {
      entity: 'withEnglishDoc',
      template: 'rel1',
      filename: 'englishDoc',
    }),
    // a text reference to a document in another language does not
    ...textReference('hub7', 'center', undefined, {
      entity: 'withSpanishDoc',
      template: 'rel1',
      filename: 'spanishDoc',
    }),
    // the entity's own side is a text reference in another language: the whole hub is dropped
    ...textReference('hub8', 'center', 'centerSpanishDoc', { entity: 'a2', template: 'rel2' }),
    factory.hub('hub8', 'center', [{ entity: 'a1', template: 'rel2' }])[1],
  ],
};

type Group = {
  key: string | null;
  connectionLabel: string | null;
  templates: { _id: string; label: string; count: number; refs?: unknown }[];
};

const summary = (groups: Group[]) =>
  groups
    .map(group => ({
      key: group.key,
      connectionLabel: group.connectionLabel,
      templates: group.templates
        .map(template => ({
          _id: template._id.toString(),
          label: template.label,
          count: template.count,
          refs: template.refs,
        }))
        .sort((a, b) => a.label.localeCompare(b.label)),
    }))
    .sort((a, b) => String(a.key).localeCompare(String(b.key)));

const group = (
  key: string | null,
  connectionLabel: string | null,
  templates: [string, number][]
) => ({
  key,
  connectionLabel,
  templates: templates.map(([template, count]) => ({
    _id: factory.idString(template),
    label: template,
    count,
    refs: undefined,
  })),
});

type TestConfig = { name: string; postgresCore: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

afterAll(async () => {
  await testingEnvironment.tearDown();
});

describe.each(testConfigs)('relationships getGroupsByConnection ($name)', ({ postgresCore }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    testingTenants.changeCurrentTenant({ featureFlags: { postgresCore } });
  });

  const groupsFor = async (options: { user?: unknown }, actor?: User) =>
    testingEnvironment.runWithContext(
      async () =>
        relationships.getGroupsByConnection('center', 'en', {
          ...options,
          excludeRefs: true,
        }) as Promise<Group[]>,
      actor ? { actor } : {}
    );

  const published = [
    group(null, null, [['Court', 1]]),
    group(factory.idString('rel1'), 'rel1', [['Case', 3]]),
    group(factory.idString('rel2'), 'rel2', [['Court', 1]]),
  ];

  it('should count published connected entities per relation type and template', async () => {
    expect(summary(await groupsFor({}))).toEqual(summary(published as Group[]));
  });

  it('should count unpublished connected entities when there is a user', async () => {
    expect(summary(await groupsFor({ user: 'found' }))).toEqual(
      summary([
        group(null, null, [['Court', 1]]),
        group(factory.idString('rel1'), 'rel1', [['Case', 4]]),
        group(factory.idString('rel2'), 'rel2', [['Court', 1]]),
      ] as Group[])
    );
  });

  it('should not count connected entities the actor is not allowed to see', async () => {
    expect(summary(await groupsFor({ user: 'found' }, User.createFrom(null)))).toEqual(
      summary(published as Group[])
    );
  });
});
