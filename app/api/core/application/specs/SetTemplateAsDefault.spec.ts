/* eslint-disable max-statements */
import { testingTenants } from '#api/utils/testingTenants.js';
import { SetTemplateAsDefaultUseCaseFactory } from '#api/core/infrastructure/factories/SetTemplateAsDefaultUseCaseFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import {
  TemplateDoesNotExistError,
  DefaultTemplateConflictError,
} from '#api/core/domain/template/errors.js';

const factory = getFixturesFactory();

type TestConfig = {
  name: string;
  postgresTemplates: boolean;
  getTemplates: () => Promise<{ _id: { toString(): string }; default?: boolean }[]>;
};

const testConfigs: TestConfig[] = [
  {
    name: 'Mongo',
    postgresTemplates: false,
    getTemplates: async () => testingEnvironment.db.getAllFrom('templates') as Promise<any[]>,
  },
  {
    name: 'Postgres',
    postgresTemplates: true,
    getTemplates: async () =>
      testingEnvironment.pg
        .getAllFrom('templates')
        .then(rows => rows.map(({ tenant_id: _, ...rest }) => rest) as any[]),
  },
];

describe('SetTemplateAsDefaultUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, { elasticIndex: true, postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe.each(testConfigs)('$name', ({ postgresTemplates, getTemplates }) => {
    const createSut = () =>
      testingEnvironment.runWithContext(
        () => SetTemplateAsDefaultUseCaseFactory.default(),
        postgresTemplates
          ? {
              tenant: {
                ...testingTenants.current(),
                featureFlags: { postgresTemplates: true },
              },
            }
          : undefined
      );

    beforeEach(async () => testingEnvironment.setFixtures({}));

    it('should set the given ID as the default template when there is no default and return affected templates', async () => {
      const idA = factory.idString('templateA');
      const idB = factory.idString('templateB');

      await testingEnvironment.setFixtures({
        templates: [factory.template('templateA', []), factory.template('templateB', [])],
      });

      const output = await createSut().execute({ templateId: idA });

      expect(output.current.id).toBe(idA);
      expect(output.current.isDefault).toBe(true);
      expect(output.previous).toBeUndefined();

      const all = await getTemplates();
      const storedA = all?.find(t => t._id.toString() === idA);
      const storedB = all?.find(t => t._id.toString() === idB);

      expect(storedA).toBeDefined();
      expect(storedA?.default).toBe(true);
      expect(storedB).toBeDefined();
      expect(storedB?.default).toBeFalsy();
    });

    it('should replace an existing default template and return previous and current', async () => {
      const oldId = factory.idString('oldDefault');
      const newId = factory.idString('newDefault');

      await testingEnvironment.setFixtures({
        templates: [
          factory.template('oldDefault', [], { default: true }),
          factory.template('newDefault', []),
        ],
      });

      const output = await createSut().execute({ templateId: newId });

      expect(output.current.id).toBe(newId);
      expect(output.current.isDefault).toBe(true);
      expect(output.previous).toBeDefined();
      expect(output.previous?.id).toBe(oldId);
      expect(output.previous?.isDefault).toBe(false);

      const all = await getTemplates();
      const oldStored = all?.find(t => t._id.toString() === oldId);
      const newStored = all?.find(t => t._id.toString() === newId);

      expect(newStored?.default).toBe(true);
      expect(oldStored?.default).toBeFalsy();
    });

    it("should fail if the given id doesn't exist", async () => {
      await testingEnvironment.setFixtures({
        templates: [factory.template('onlyOne', [])],
      });

      await expect(createSut().execute({ templateId: '000000000000000000000000' })).rejects.toThrow(
        TemplateDoesNotExistError
      );
    });

    it('should fail if trying to set a template that is already default', async () => {
      const id = factory.idString('alreadyDefault');
      await testingEnvironment.setFixtures({
        templates: [
          factory.template('alreadyDefault', [], {
            default: true,
          }),
        ],
      });

      await expect(createSut().execute({ templateId: id })).rejects.toThrow(
        DefaultTemplateConflictError
      );
    });
  });
});
