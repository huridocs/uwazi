import { methods } from './helpers';

export default {
  fieldParseError: logData => {
    const { title, propertyName, sharedId, migrationName } = logData;

    const semantic = {
      beautified: true,
      action: methods.migrate,
      name: `${title} (${sharedId})`,
      extra: 'Must fix manually',
      description: `[${migrationName}] Error parsing property ${propertyName} in`,
    };

    return semantic;
  },
};
