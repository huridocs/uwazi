import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';

export const languageBackendConfigs = [
  { name: 'Mongo', postgresSettings: false, postgresTranslations: false },
  { name: 'Postgres settings', postgresSettings: true, postgresTranslations: false },
  { name: 'Postgres translations', postgresSettings: false, postgresTranslations: true },
  { name: 'Postgres', postgresSettings: true, postgresTranslations: true },
];

export const withLanguageBackendFlags = <T>(
  postgresSettings: boolean,
  postgresTranslations: boolean,
  fn: () => T
): T =>
  testingEnvironment.runWithContext(
    fn,
    postgresSettings || postgresTranslations
      ? {
          tenant: {
            ...testingTenants.current(),
            featureFlags: {
              ...(postgresSettings ? { postgresSettings: true } : {}),
              ...(postgresTranslations ? { postgresTranslations: true } : {}),
            },
          },
        }
      : undefined
  );

export const languageBackendPostgresMirror = (
  postgresSettings: boolean,
  postgresTranslations: boolean
): string[] => [
  ...(postgresSettings ? ['settings'] : []),
  ...(postgresTranslations ? ['translationsV2'] : []),
];
