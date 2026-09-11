import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';
import { IXModel } from '../IXModelsDataSource.js';

/**
 * The single fixture set behind the IXModelsDataSource contract suite. One declaration serves
 * both backends: `testingEnvironment.setFixtures` mirrors `ixextractors` and `ixmodels` into
 * Postgres. `ixextractors` is declared first: tables are loaded in key order and `ix_models`
 * references `ix_extractors`.
 *
 * Every model needs its extractor, including the ones cases create, so `untrained`, `fresh` and
 * `routed` are extractors without a model.
 */

const f = getFixturesFactory();

const TENANT_ID = 'ix-models-contract';

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const extractorNames = ['running', 'idle', 'untrained', 'fresh', 'routed'];

const models = {
  running: {
    ...f.ixModel('running model', 'running'),
    findingSuggestions: true,
    maxSuggestionsToFind: 10,
    processRun: {
      mode: 'process_selected',
      samplePolicy: 'only_marked',
      suggestionsRunTimestamp: 1000,
      findSuggestionsSharedIds: ['a', 'b', 'c'],
      findSuggestionsInitialSharedIdsCount: 3,
    },
  } as IXModel,
  idle: {
    ...f.ixModel('idle model', 'idle'),
    findingSuggestions: false,
    totalSuggestionsToFind: 4,
  } as IXModel,
};

const fixtures: DBFixture = {
  ixextractors: extractorNames.map(name =>
    f.ixExtractor(name, `target_${name}`, [], { pdf: true })
  ),
  ixmodels: Object.values(models),
};

export { f, TENANT_ID, testConfigs, models, fixtures };
