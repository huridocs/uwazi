/* eslint-disable max-statements */
import { SetTemplateAsDefaultUseCaseFactory } from '#api/core/infrastructure/factories/SetTemplateAsDefaultUseCaseFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import {
  TemplateDoesNotExistError,
  DefaultTemplateConflictError,
} from '#api/core/domain/template/errors.js';
import { ElasticSearchClientFactory } from '#api/core/infrastructure/elasticSearch/ElasticSearchClientFactory.js';
import { DependenciesContext, ContextDependencies } from '#api/core/libs/DependenciesContext.js';
import { tenants } from '#api/tenants/index.js';

const factory = getFixturesFactory();

describe('SetTemplateAsDefaultUseCase', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({}, true);

    const tenant = tenants.current();
    jest.spyOn(DependenciesContext, 'getStore').mockReturnValue({
      instances: {
        elasticClient: ElasticSearchClientFactory.tenantAware(tenant.name),
      },
      factories: {},
    } as ContextDependencies);
  });

  beforeEach(async () => {
    await testingEnvironment.setFixtures({});
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it('should set the given ID as the default template when there is no default and return affected templates', async () => {
    const idA = factory.idString('templateA');
    const idB = factory.idString('templateB');

    await testingEnvironment.setFixtures({
      templates: [factory.template('templateA', []), factory.template('templateB', [])],
    });

    const sut = SetTemplateAsDefaultUseCaseFactory.create();

    const output = await sut.execute({ templateId: idA });

    expect(output.current.id).toBe(idA);
    expect(output.current.isDefault).toBe(true);
    expect(output.previous).toBeUndefined();

    const all = await testingEnvironment.db.getAllFrom('templates');
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

    const sut = SetTemplateAsDefaultUseCaseFactory.create();

    const output = await sut.execute({ templateId: newId });

    expect(output.current.id).toBe(newId);
    expect(output.current.isDefault).toBe(true);
    expect(output.previous).toBeDefined();
    expect(output.previous?.id).toBe(oldId);
    expect(output.previous?.isDefault).toBe(false);

    const all = await testingEnvironment.db.getAllFrom('templates');
    const oldStored = all?.find(t => t._id.toString() === oldId);
    const newStored = all?.find(t => t._id.toString() === newId);

    expect(newStored?.default).toBe(true);
    expect(oldStored?.default).toBeFalsy();
  });

  it("should fail if the given id doesn't exist", async () => {
    await testingEnvironment.setFixtures({
      templates: [factory.template('onlyOne', [])],
    });

    const sut = SetTemplateAsDefaultUseCaseFactory.create();

    await expect(sut.execute({ templateId: '000000000000000000000000' })).rejects.toThrow(
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

    const sut = SetTemplateAsDefaultUseCaseFactory.create();

    await expect(sut.execute({ templateId: id })).rejects.toThrow(DefaultTemplateConflictError);
  });
});
