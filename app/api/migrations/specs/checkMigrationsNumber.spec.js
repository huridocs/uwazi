/* eslint-disable import/no-dynamic-require, global-require */
import fs from 'fs';
import path from 'path';
import { migrator } from '../migrator';

describe('Unique migrations', () => {
  it('should not repeat migration deltas', async () => {
    const files = fs.readdirSync(migrator.migrationsDir);
    const migrations = files.map(
      migration => require(path.join(migrator.migrationsDir, migration)).default
    );
    const deltas = migrations.map(m => m.delta);

    expect(new Set(deltas).size).toBe(deltas.length);
  });
});
