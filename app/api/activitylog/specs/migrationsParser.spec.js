import { typeParsers } from '../migrationsParser';

describe('migrationsParser', () => {
  it('should beautify an fieldParseError log', () => {
    const beautified = typeParsers.fieldParseError({
      title: 'title',
      propertyName: 'propertyName',
      sharedId: 'sharedId',
      migrationName: 'migration-name',
    });

    expect(beautified).toEqual({
      action: 'MIGRATE',
      description: '[migration-name] Error parsing property propertyName in',
      name: 'title (sharedId)',
      extra: 'Must fix manually',
    });
  });
});
