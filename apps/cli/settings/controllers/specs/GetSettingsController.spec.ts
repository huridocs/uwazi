import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { SettingsOutputSchema } from '../../contracts.js';
import { GetSettingsController } from '../GetSettingsController.js';
import { fixtures, printed } from './fixtures.js';

describe.each(ControllerSpecs.backends)('GetSettingsController ($name)', ({ postgresCore }) => {
  it('should print the whole settings document, sync included', async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    ControllerSpecs.useBackend(postgresCore);

    const output = await ControllerSpecs.asCli(async () => GetSettingsController.handle());

    expect(SettingsOutputSchema.parse(output)).toEqual(printed);
  });

  it('should print an empty object when the tenant has no settings', async () => {
    await testingEnvironment.setUp({ settings: [] }, { postgres: true });
    ControllerSpecs.useBackend(postgresCore);

    expect(await ControllerSpecs.asCli(async () => GetSettingsController.handle())).toEqual({});
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
