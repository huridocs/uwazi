import { Methods } from 'api/activitylog/activityLogBuilder';

export const typeParsers = {
  fieldParseError: logData => {
    const { title, propertyName, sharedId, migrationName } = logData;

    return {
      action: Methods.Migrate,
      name: `${title} (${sharedId})`,
      extra: 'Must fix manually',
      description: `[${migrationName}] Error parsing property ${propertyName} in`,
    };
  },
};
