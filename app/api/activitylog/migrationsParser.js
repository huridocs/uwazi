import { methods } from './helpers';

export const typeParsers = {
  fieldParseError: logData => {
    const { title, propertyName, sharedId, migrationName } = logData;

    return {
      beautified: true,
      action: methods.migrate,
      name: `${title} (${sharedId})`,
      extra: 'Must fix manually',
      description: `[${migrationName}] Error parsing property ${propertyName} in`,
    };
  },
};
