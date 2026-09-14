import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { TrainingFileRow } from '../../domain/IXTrainingMaterialsQueryService.js';
import { IXTrainingMaterialsQueryServiceFactory } from '../IXTrainingMaterialsQueryServiceFactory.js';

const factory = getFixturesFactory();

const extractorId = factory.id('extractor');

const collect = async (rows: AsyncIterable<TrainingFileRow>) => {
  const collected: TrainingFileRow[] = [];
  for await (const row of rows) {
    collected.push(row);
  }
  return collected;
};

const stream = async (limit = 2000) =>
  collect(
    IXTrainingMaterialsQueryServiceFactory.default().streamFilesForTraining({
      extractorId,
      property: 'target_text',
      limit,
    })
  );

const suggestion = (name: string, overrides: Record<string, unknown> = {}) =>
  factory.ixSuggestion({
    _id: factory.id(name),
    extractorId,
    entityId: 'shared1',
    entityLanguageId: factory.id('entity-en') as any,
    fileId: factory.id(`file-${name}`) as any,
    propertyName: 'target_text',
    language: 'en',
    currentValue: 'labeled text',
    ...overrides,
  } as any);

const readyFile = (name: string) => ({
  _id: factory.id(`file-${name}`),
  entity: 'shared1',
  language: 'en',
  status: 'ready',
  filename: `${name}.pdf`,
  propertySelections: [
    { name: 'target_text', selection: { text: 'selected text' } },
    { name: 'another_property', selection: { text: 'not this one' } },
  ],
});

const readySegmentation = (name: string) => ({
  _id: factory.id(`seg-${name}`),
  fileID: factory.id(`file-${name}`),
  filename: `${name}.pdf`,
  xmlname: `${name}.xml`,
  status: 'ready',
  segmentation: { page_height: 1, page_width: 2, paragraphs: [] },
});

/**
 * Contract test for the training-material walk. Every one of its three joins is load-bearing: a
 * suggestion with no ready file, or no ready segmentation, cannot be trained on, and dropping it
 * silently is the behaviour the ML service depends on.
 */
describe('MongoIXTrainingMaterialsQueryService', () => {
  afterAll(async () => testingEnvironment.tearDown());

  const baseFixtures = {
    entities: [
      {
        _id: factory.id('entity-en'),
        sharedId: 'shared1',
        language: 'en',
        title: 'Entity',
        metadata: { target_text: [{ value: 'entity value', label: 'entity label' }] },
      },
    ],
  };

  it('should pair a suggestion with its entity value, its labels and its segmentation', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a')],
      files: [readyFile('a')],
      segmentations: [readySegmentation('a')],
    } as any);

    const rows = await stream();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      entityId: 'shared1',
      language: 'en',
      currentValue: 'labeled text',
      entityLanguage: { metadata: [{ value: 'entity value', label: 'entity label' }] },
      segmentation: { xmlname: 'a.xml' },
    });
  });

  /** Only the extractor's own property may reach the training material. */
  it('should keep only the property selections of the extractor property', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a')],
      files: [readyFile('a')],
      segmentations: [readySegmentation('a')],
    } as any);

    const rows = await stream();

    expect(rows[0].file.propertySelections).toEqual([
      { name: 'target_text', selection: { text: 'selected text' } },
    ]);
  });

  it('should skip a suggestion whose file is not ready', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a')],
      files: [{ ...readyFile('a'), status: 'processing' }],
      segmentations: [readySegmentation('a')],
    } as any);

    expect(await stream()).toEqual([]);
  });

  it('should skip a suggestion whose segmentation is not ready', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a')],
      files: [readyFile('a')],
      segmentations: [{ ...readySegmentation('a'), status: 'processing' }],
    } as any);

    expect(await stream()).toEqual([]);
  });

  /** Nothing was labeled, so there is nothing to learn from. */
  it.each([{ currentValue: '' }, { currentValue: null }, { currentValue: [] }])(
    'should skip a suggestion with no current value (%p)',
    async overrides => {
      await testingEnvironment.setUp({
        ...baseFixtures,
        ixsuggestions: [suggestion('a', overrides)],
        files: [readyFile('a')],
        segmentations: [readySegmentation('a')],
      } as any);

      expect(await stream()).toEqual([]);
    }
  );

  it('should stop at the given limit', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a'), suggestion('b'), suggestion('c')],
      files: [readyFile('a'), readyFile('b'), readyFile('c')],
      segmentations: [readySegmentation('a'), readySegmentation('b'), readySegmentation('c')],
    } as any);

    expect(await stream(2)).toHaveLength(2);
  });

  it('should never walk another extractor', async () => {
    await testingEnvironment.setUp({
      ...baseFixtures,
      ixsuggestions: [suggestion('a', { extractorId: factory.id('other') })],
      files: [readyFile('a')],
      segmentations: [readySegmentation('a')],
    } as any);

    expect(await stream()).toEqual([]);
  });
});
