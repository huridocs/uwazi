import type { ActivityDescription } from './ActivityDescription.js';
import type { ActivityData } from './contracts/RelatedData.js';

/** Describes the entries migrations write to the activity log, by the type each one carries. */
class MigrationLogDescriber {
  private static readonly byType: Record<string, (data: ActivityData) => ActivityDescription> = {
    fieldParseError: ({ title, propertyName, sharedId, migrationName }) => ({
      action: 'MIGRATE',
      name: `${title} (${sharedId})`,
      extra: 'Must fix manually',
      description: `[${migrationName}] Error parsing property ${propertyName} in`,
    }),
  };

  static describe(body: string): ActivityDescription {
    const data: ActivityData = JSON.parse(body);
    const describe = MigrationLogDescriber.byType[data.type] as
      ((data: ActivityData) => ActivityDescription) | undefined;

    return describe ? describe(data) : { action: 'RAW' };
  }
}

export { MigrationLogDescriber };
