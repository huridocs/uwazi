import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { IXSuggestionsSampleQueryServiceFactory } from '../IXSuggestionsSampleQueryServiceFactory.js';

const factory = getFixturesFactory();

const queryService = () => IXSuggestionsSampleQueryServiceFactory.default();

const extractorId = factory.id('extractor');

const labeledPending = (title: string) =>
  factory.ixSuggestion({
    extractorId,
    entityTitle: title,
    date: null as any,
    state: { labeled: true },
  });

const unlabeledPending = (title: string) =>
  factory.ixSuggestion({
    extractorId,
    entityTitle: title,
    date: null as any,
    state: { labeled: false },
  });

/**
 * Contract test for the sampling half of the process-run batch. How big each half should be is
 * `balancedSampleSizes`, tested without a database; this covers only that the store returns the
 * asked-for number of rows from the asked-for set.
 */
describe('MongoIXSuggestionsSampleQueryService', () => {
  afterAll(async () => testingEnvironment.tearDown());

  it('should return the requested number of rows from each half', async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [
        labeledPending('l1'),
        labeledPending('l2'),
        labeledPending('l3'),
        unlabeledPending('u1'),
        unlabeledPending('u2'),
      ],
    } as any);

    const sampled = await queryService().sampleForProcess({
      extractorId,
      sizes: { labeled: 2, unlabeled: 1 },
    });

    const titles = sampled.map(s => s.entityTitle as string);
    expect(titles).toHaveLength(3);
    expect(titles.filter(t => t.startsWith('l'))).toHaveLength(2);
    expect(titles.filter(t => t.startsWith('u'))).toHaveLength(1);
  });

  it('should return nothing when both sizes are zero', async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [labeledPending('l1'), unlabeledPending('u1')],
    } as any);

    expect(
      await queryService().sampleForProcess({
        extractorId,
        sizes: { labeled: 0, unlabeled: 0 },
      })
    ).toEqual([]);
  });

  it('should never sample another extractor', async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [
        labeledPending('mine'),
        factory.ixSuggestion({
          extractorId: factory.id('other'),
          entityTitle: 'theirs',
          date: null as any,
          state: { labeled: true },
        }),
      ],
    } as any);

    const sampled = await queryService().sampleForProcess({
      extractorId,
      sizes: { labeled: 10, unlabeled: 10 },
    });

    expect(sampled.map(s => s.entityTitle)).toEqual(['mine']);
  });

  /**
   * The sizes are computed from a count over the same status filter, so sampling a different set
   * than the one counted would silently hand the run rows it had not accounted for.
   */
  it('should sample only within the given status filter', async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [
        unlabeledPending('undated'),
        factory.ixSuggestion({
          extractorId,
          entityTitle: 'errored',
          date: 1000,
          state: { labeled: false, error: true },
        }),
        factory.ixSuggestion({
          extractorId,
          entityTitle: 'done',
          date: 1000,
          state: { labeled: false },
        }),
      ],
    } as any);

    const sampled = await queryService().sampleForProcess({
      extractorId,
      statusFilter: { error: true },
      sizes: { labeled: 10, unlabeled: 10 },
    });

    expect(sampled.map(s => s.entityTitle)).toEqual(['errored']);
  });

  it('should default to all three pending statuses when no filter is given', async () => {
    await testingEnvironment.setUp({
      ixsuggestions: [
        unlabeledPending('undated'),
        factory.ixSuggestion({
          extractorId,
          entityTitle: 'errored',
          date: 1000,
          state: { labeled: false, error: true },
        }),
        factory.ixSuggestion({
          extractorId,
          entityTitle: 'obsolete',
          date: 1000,
          state: { labeled: false, obsolete: true },
        }),
        factory.ixSuggestion({
          extractorId,
          entityTitle: 'done',
          date: 1000,
          state: { labeled: false },
        }),
      ],
    } as any);

    const sampled = await queryService().sampleForProcess({
      extractorId,
      sizes: { labeled: 10, unlabeled: 10 },
    });

    expect(sampled.map(s => s.entityTitle).sort()).toEqual(['errored', 'obsolete', 'undated']);
  });
});
