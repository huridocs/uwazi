import { ZodError } from 'zod';
import { EventEmitterFactory } from '#api/core/libs/eventEmitter/EventEmitterFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { SettingsOutputSchema } from '../../contracts.js';
import { GetSettingsController } from '../GetSettingsController.js';
import { UpdateSettingsCliInput, UpdateSettingsController } from '../UpdateSettingsController.js';
import { fixtures } from './fixtures.js';

/**
 * Not imported from the listener module on purpose: importing it registers the listener, which
 * would hide a CLI process that never does.
 */
const SETTINGS_CHANGED_JOB = 'SettingsChangedEvent:BroadcastSettingsChanged';

describe.each(ControllerSpecs.backends)('UpdateSettingsController ($name)', ({ postgresCore }) => {
  const storedSettings = async () =>
    (await ControllerSpecs.stored(postgresCore, 'settings'))[0] as Record<string, unknown>;

  const update = async (input: UpdateSettingsCliInput) =>
    ControllerSpecs.asCli(async () => UpdateSettingsController.handle(input));

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    await testingEnvironment.pg.pool!.query('DELETE FROM jobs');
    ControllerSpecs.useBackend(postgresCore);
  });

  it('should replace the fields sent, keep the others and print the whole document', async () => {
    const output = await update({ site_name: 'Renamed' });

    expect(SettingsOutputSchema.parse(output)).toMatchObject({
      site_name: 'Renamed',
      features: { ocr: { url: 'http://ocr' }, favorites: true },
      sync: [expect.objectContaining({ password: 'sync-secret' })],
    });
    expect(await storedSettings()).toMatchObject({ site_name: 'Renamed' });
  });

  it('should replace nested objects whole, so an omitted feature is removed', async () => {
    const output = await update({ features: { favorites: true } });

    expect(output.features).toEqual({ favorites: true });
    expect((await storedSettings()).features).toEqual({ favorites: true });
  });

  it('should queue the settings changed broadcast', async () => {
    await ControllerSpecs.asCli(
      async () => UpdateSettingsController.handle({ site_name: 'Renamed' }),
      { eventEmitter: () => EventEmitterFactory.default() }
    );

    const jobs = await ControllerSpecs.stored(postgresCore, 'jobs');
    expect(jobs).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: SETTINGS_CHANGED_JOB })])
    );
  });

  it('should accept the document settings get printed', async () => {
    const printed = await ControllerSpecs.asCli(async () => GetSettingsController.handle());

    await expect(update(printed as UpdateSettingsCliInput)).resolves.toMatchObject(printed);
  });

  it('should reject a field the settings schema does not know, writing nothing', async () => {
    const input = { site_name: 'Renamed', unknownField: true } as UpdateSettingsCliInput;

    await expect(update(input)).rejects.toBeInstanceOf(ZodError);
    expect(await storedSettings()).toMatchObject({ site_name: 'Uwazi' });
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
