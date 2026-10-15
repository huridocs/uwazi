// eslint-disable-next-line no-restricted-imports
import { existsSync, mkdirSync, readFileSync, rmSync } from 'fs';
import path from 'path';
import type { Pool } from 'pg';
import { fileURLToPath } from 'url';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import {
  clearBlankState,
  seedBlankState,
} from '#api/infrastructure/blank_state/specs/blankStateFixtures.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { BlankStateDumpOutputSchema } from '../../contracts.js';
import { DumpBlankStateController } from '../DumpBlankStateController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('DumpBlankStateController', () => {
  let dataDir: string;
  let pool: Pool;

  beforeAll(async () => {
    await testingEnvironment.setUp({}, { postgres: true });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  beforeEach(async () => {
    const testPool = testingEnvironment.pg.pool;
    if (!testPool) throw new Error('PG pool not available');
    pool = testPool;
    dataDir = path.join(__dirname, `dump-ctrl-test-${Date.now()}`);
    mkdirSync(dataDir, { recursive: true });
    await seedBlankState(pool, testingTenants.current().name, {
      ids: { settings: 'settings-doc', user: 'user-admin', translations: ['tr-1'] },
    });
  });

  afterEach(async () => {
    rmSync(dataDir, { recursive: true, force: true });
    await clearBlankState(pool);
  });

  it('should dump the current tenant into the given directory', async () => {
    const format = jest.fn(async () => {});

    const output = await ControllerSpecs.asCli(async () =>
      DumpBlankStateController.handle({ pool, dataDir, format })
    );

    expect(BlankStateDumpOutputSchema.parse(output).tables.sort()).toEqual(
      ['settings', 'templates', 'translations', 'users'].sort()
    );
    expect(format).toHaveBeenCalledWith(dataDir, [
      'settings',
      'templates',
      'translations',
      'users',
    ]);

    const templates = JSON.parse(readFileSync(path.join(dataDir, 'templates.json'), 'utf-8'));
    expect(templates[0]).toMatchObject({ _id: 'tpl-doc', name: 'Document' });

    expect(existsSync(path.join(dataDir, 'updatelogs.json'))).toBe(false);
  });
});
