import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { DBFixture } from '#api/utils/testing_db.js';

/**
 * The single fixture set behind the IXExtractorsDataSource contract suite. One declaration
 * serves both backends: `testingEnvironment.setFixtures` mirrors `ixextractors` into Postgres
 * through `IXExtractorsMigrationConfig`.
 */

const f = getFixturesFactory();

const TENANT_ID = 'ix-extractors-contract';

type TestConfig = { name: string; usePostgres: boolean };

const testConfigs: TestConfig[] = [
  { name: 'Mongo', usePostgres: false },
  { name: 'Postgres', usePostgres: true },
];

const extractors = {
  textOnA: f.ixExtractor('text on A', 'target_a', ['template A'], { property: 'source_a' }),
  pdfOnA: f.ixExtractor('pdf on A', 'target_b', ['template A'], { pdf: true }),
  textOnAB: f.ixExtractor('text on A and B', 'target_c', ['template A', 'template B'], {
    property: 'source_c',
  }),
  pdfOnB: f.ixExtractor('pdf on B', 'target_a', ['template B'], { pdf: true }),
  withoutTemplates: f.ixExtractor('without templates', 'target_d', [], { property: 'source_d' }),
};

const fixtures: DBFixture = {
  ixextractors: Object.values(extractors),
};

const byName = <T extends { name: string }>(list: T[]) =>
  [...list].sort((a, b) => a.name.localeCompare(b.name));

export { f, TENANT_ID, testConfigs, extractors, fixtures, byName };
