import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { DBFixture, testingDB } from '#api/utils/testing_db.js';
import { testingPG } from '#api/utils/testing_pg.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  IXTrainingMaterialsQueryService,
  TrainingFileRow,
  TrainingMaterialsQuery,
} from '../IXTrainingMaterialsQueryService.js';
import { IXTrainingMaterialsQueryServiceFactory } from '../../infrastructure/IXTrainingMaterialsQueryServiceFactory.js';
import { f, TENANT_ID, testConfigs } from './IXSuggestionsContractFixtures.js';

type Sut = () => IXTrainingMaterialsQueryService;

const property = 'target_text';

const extractors = {
  training: f.id('training extractor'),
  segmentations: f.id('segmentations extractor'),
  limit: f.id('limit extractor'),
  other: f.id('other training extractor'),
};

const suggestion = (
  name: string,
  extractorId = extractors.training,
  currentValue: unknown = 'labeled text'
) =>
  f.ixSuggestion({
    _id: f.id(name),
    extractorId,
    entityId: 'shared1',
    entityLanguageId: f.id('entity-en'),
    fileId: f.id(`file ${name}`),
    propertyName: property,
    language: 'en',
    currentValue,
  } as Parameters<typeof f.ixSuggestion>[0]);

const withoutCurrentValue = (name: string) => {
  const { currentValue, ...rest } = suggestion(name);
  return rest;
};

const file = (name: string, status = 'ready') => ({
  _id: f.id(`file ${name}`),
  originalname: `${name}.pdf`,
  filename: `${name}.pdf`,
  mimetype: 'application/pdf',
  type: 'document',
  entity: 'shared1',
  language: 'en',
  status,
  propertySelections: [
    { name: property, selection: { text: `${name} selected text` } },
    { name: 'another_property', selection: { text: 'not this one' } },
  ],
});

const segmentation = (name: string, xmlname = `${name}.xml`, status = 'ready') => ({
  _id: f.id(`segmentation ${xmlname}`),
  fileID: f.id(`file ${name}`),
  filename: `${name}.pdf`,
  xmlname,
  status,
  segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
});

/** A suggestion of the training extractor with a ready file and a ready segmentation. */
const trainable = (name: string, extractorId = extractors.training) => ({
  ixsuggestions: [suggestion(name, extractorId)],
  files: [file(name)],
  segmentations: [segmentation(name)],
});

/** Every suggestion that must not be walked, keyed by why; each has a file and a segmentation. */
const excluded = {
  'an empty string currentValue': suggestion('empty string', extractors.training, ''),
  'a null currentValue': suggestion('null value', extractors.training, null),
  'an empty array currentValue': suggestion('empty array', extractors.training, []),
  'an array currentValue with an empty value': suggestion('empty item', extractors.training, ['']),
  'no currentValue': withoutCurrentValue('no value'),
};

const scenarios = [
  trainable('a'),
  {
    ixsuggestions: [suggestion('b')],
    files: [file('b')],
    segmentations: [segmentation('b', 'b1.xml'), segmentation('b', 'b2.xml')],
  },
  {
    ixsuggestions: Object.values(excluded),
    files: ['empty string', 'null value', 'empty array', 'empty item', 'no value'].map(name =>
      file(name)
    ),
    segmentations: ['empty string', 'null value', 'empty array', 'empty item', 'no value'].map(
      name => segmentation(name)
    ),
  },
  {
    ixsuggestions: [suggestion('file not ready')],
    files: [file('file not ready', 'processing')],
    segmentations: [segmentation('file not ready')],
  },
  { ixsuggestions: [suggestion('no file')], segmentations: [segmentation('no file')] },
  { ixsuggestions: [suggestion('no segmentation')], files: [file('no segmentation')] },
  {
    ixsuggestions: [suggestion('segmentation not ready')],
    files: [file('segmentation not ready')],
    segmentations: [segmentation('segmentation not ready', undefined, 'processing')],
  },
  {
    ixsuggestions: [
      suggestion('two segmentations', extractors.segmentations),
      suggestion('empty before limit', extractors.segmentations, ''),
    ],
    files: [file('two segmentations'), file('empty before limit')],
    segmentations: [
      segmentation('two segmentations', 'first.xml'),
      segmentation('two segmentations', 'second.xml'),
      segmentation('empty before limit'),
    ],
  },
  trainable('limit 1', extractors.limit),
  trainable('limit 2', extractors.limit),
  trainable('limit 3', extractors.limit),
  trainable('other extractor', extractors.other),
];

const merged = (key: 'ixsuggestions' | 'files' | 'segmentations') =>
  scenarios.flatMap(scenario => (scenario as Partial<Record<typeof key, unknown[]>>)[key] ?? []);

/** `segmentations` stay in Mongo for both backends: they are not mirrored. */
const fixtures = {
  ixextractors: [
    f.ixExtractor('training extractor', property, ['template']),
    f.ixExtractor('segmentations extractor', property, ['template']),
    f.ixExtractor('limit extractor', property, ['template']),
    f.ixExtractor('other training extractor', property, ['template']),
  ],
  entities: [
    {
      _id: f.id('entity-en'),
      sharedId: 'shared1',
      language: 'en',
      title: 'Entity',
      metadata: {
        [property]: [{ value: 'entity value', label: 'entity label' }],
        another_property: [{ value: 'not this one' }],
      },
    },
  ],
  ixsuggestions: merged('ixsuggestions'),
  files: merged('files'),
  segmentations: merged('segmentations'),
} as DBFixture;

const collect = async (rows: AsyncIterable<TrainingFileRow>) => {
  const collected: TrainingFileRow[] = [];
  for await (const row of rows) {
    collected.push(row);
  }
  return collected;
};

const walk = async (sut: Sut, query: Partial<TrainingMaterialsQuery> = {}) =>
  collect(
    sut().streamFilesForTraining({
      extractorId: extractors.training,
      property,
      limit: 2000,
      ...query,
    })
  );

/**
 * The fields the training walk reads, as they reach it: Mongo's joined documents also carry their
 * `_id`s and the suggestion's other fields, which nothing consumes.
 */
const consumed = (rows: TrainingFileRow[]) =>
  rows
    .map(row =>
      JSON.parse(
        JSON.stringify({
          fileId: row.fileId,
          entityId: row.entityId,
          language: row.language,
          currentValue: row.currentValue,
          entityLanguage: { metadata: row.entityLanguage.metadata },
          file: { propertySelections: row.file.propertySelections, filename: row.file.filename },
          segmentation: {
            filename: row.segmentation.filename,
            xmlname: row.segmentation.xmlname,
            segmentation: row.segmentation.segmentation,
            propertySelections: row.segmentation.propertySelections,
          },
        })
      )
    )
    .sort((a, b) => a.segmentation.xmlname.localeCompare(b.segmentation.xmlname));

const expectedRow = (name: string, xmlname = `${name}.xml`) => ({
  fileId: f.id(`file ${name}`).toString(),
  entityId: 'shared1',
  language: 'en',
  currentValue: 'labeled text',
  entityLanguage: { metadata: [{ value: 'entity value', label: 'entity label' }] },
  file: {
    propertySelections: [{ name: property, selection: { text: `${name} selected text` } }],
    filename: `${name}.pdf`,
  },
  segmentation: {
    filename: `${name}.pdf`,
    xmlname,
    segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
  },
});

const expectedWalk = [expectedRow('a'), expectedRow('b', 'b1.xml'), expectedRow('b', 'b2.xml')];

const xmlnamesOf = (rows: TrainingFileRow[]) => rows.map(row => row.segmentation.xmlname).sort();

const walkCases = (sut: Sut) => {
  /**
   * Keeps only the extractor property's selections and entity values: nothing else may reach the
   * training material.
   */
  it('should yield one row per suggestion with a ready file and a ready segmentation', async () => {
    expect(consumed(await walk(sut))).toEqual(expectedWalk);
  });

  it('should yield a row per ready segmentation when a file has more than one', async () => {
    const rows = await walk(sut);

    expect(xmlnamesOf(rows.filter(row => row.fileId.equals(f.id('file b'))))).toEqual([
      'b1.xml',
      'b2.xml',
    ]);
  });

  /** Nothing was labeled, so there is nothing to learn from. */
  it.each(Object.keys(excluded))('should exclude a suggestion with %s', async reason => {
    const { fileId } = excluded[reason as keyof typeof excluded];
    const rows = await walk(sut);

    expect(rows.some(row => row.fileId.equals(fileId!))).toBe(false);
  });

  /** A suggestion that cannot be trained on drops out silently; the ML service depends on it. */
  it.each(['file not ready', 'no file', 'no segmentation', 'segmentation not ready'])(
    'should exclude a suggestion with %s',
    async name => {
      const rows = await walk(sut);

      expect(rows.some(row => row.fileId.equals(f.id(`file ${name}`)))).toBe(false);
    }
  );

  it('should never walk another extractor', async () => {
    expect(xmlnamesOf(await walk(sut, { extractorId: extractors.other }))).toEqual([
      'other extractor.xml',
    ]);
  });
};

const limitCases = (sut: Sut) => {
  it('should stop at the given limit', async () => {
    expect(await walk(sut, { extractorId: extractors.limit, limit: 2 })).toHaveLength(2);
  });

  /**
   * Mongo's `$limit` counts suggestions, after the current value match and before the joins, so a
   * file with two segmentations yields both rows under a limit of one.
   */
  it('should apply limit to suggestions before the joins', async () => {
    const rows = await walk(sut, { extractorId: extractors.segmentations, limit: 1 });

    expect(xmlnamesOf(rows)).toEqual(['first.xml', 'second.xml']);
  });
};

/**
 * Suggestions, entities and files are mirrored into both stores, so every other case would pass
 * against the wrong one. With the other store's copies gone, only the tenant's store can answer.
 */
const storeCases = (sut: Sut, usePostgres: boolean) => {
  it("should read suggestions, entities and files from the tenant's store", async () => {
    if (usePostgres) {
      await testingDB.clear(['ixsuggestions', 'entities', 'files']);
    } else {
      await testingPG.clear(['ix_suggestions', 'entities', 'files']);
    }

    expect(consumed(await walk(sut))).toEqual(expectedWalk);
  });
};

/**
 * The IXTrainingMaterialsQueryService contract suite, run against the Mongo and the Postgres
 * implementation: the documents a training run walks. Every join is load-bearing — a suggestion
 * with no ready file, or no ready segmentation, cannot be trained on.
 */
describe('IXTrainingMaterialsQueryService', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => testingEnvironment.tearDown());

  describe.each(testConfigs)('$name', ({ usePostgres }) => {
    beforeEach(async () => {
      testingTenants.changeCurrentTenant({
        name: TENANT_ID,
        featureFlags: { postgresCore: usePostgres },
      });

      await testingEnvironment.setFixtures(fixtures);
    });

    const sut: Sut = () =>
      testingEnvironment.runWithContext(() => IXTrainingMaterialsQueryServiceFactory.default());

    walkCases(sut);
    limitCases(sut);
    storeCases(sut, usePostgres);
  });
});
