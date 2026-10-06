import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { UsageReportOutputSchema } from '../../contracts.js';
import { UsageReportController } from '../UsageReportController.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';

const f = getFixturesFactory();

const fixtures = {
  entities: [...f.entityInMultipleLanguages(['en', 'es'], 'entity1', 'template')],
  files: [
    f.document('doc1', { mimetype: 'application/pdf', size: 1000 }),
    f.attachment('att1', { mimetype: 'image/png', size: 200 }),
  ],
};

const emptyKind = { count: 0, size: 0 };

describe.each(ControllerSpecs.backends)('UsageReportController ($name)', ({ postgresCore }) => {
  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true, elasticIndex: true });
    ControllerSpecs.useBackend(postgresCore);
  });

  it("should report the tenant's usage in the CLI output contract", async () => {
    const output = UsageReportOutputSchema.parse(
      await ControllerSpecs.asCli(async () => UsageReportController.handle())
    );

    expect(output).toMatchObject({
      entitiesCount: 1,
      filesCount: { document: 1, attachment: 1, custom: 0, thumbnail: 0 },
      filesByBucket: {
        pdf: { count: 1, size: 1000 },
        image: { count: 1, size: 200 },
        video: emptyKind,
        audio: emptyKind,
        office: emptyKind,
        text: emptyKind,
        other: emptyKind,
        unknown: emptyKind,
      },
      filesStorage: 1200,
    });
    expect(output.dbStorage).toBe(
      output.dbStorageByEngine.mongo + output.dbStorageByEngine.postgres
    );
    expect(output.elasticStorage).toBeGreaterThan(0);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
