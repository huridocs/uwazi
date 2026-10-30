import { readFileSync } from 'fs';
import { BLANK_STATE_DUMP_FILE } from '#api/infrastructure/blank_state/paths.js';
import { parseManifest } from '#api/infrastructure/tenant_backup/manifest.js';

const CORE_BLANK_STATE_TABLES = [
  'settings',
  'templates',
  'thesauri',
  'relationship_types',
  'users',
  'usergroups',
  'translations',
  'pages',
  'page_locales',
  'page_releases',
];

describe('committed blank-state dump', () => {
  it('has a well-formed manifest that includes the core blank-state tables', () => {
    const [firstLine] = readFileSync(BLANK_STATE_DUMP_FILE, 'utf8').split('\n');
    const manifest = parseManifest(firstLine);

    expect(manifest.schemaVersion).toBeGreaterThan(0);
    expect(manifest.tables.map(table => table.name)).toEqual(
      expect.arrayContaining(CORE_BLANK_STATE_TABLES)
    );
  });
});
