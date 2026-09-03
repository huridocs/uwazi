import { testingTenants } from '#api/utils/testingTenants.js';

export const pagesBackendConfigs = [
  { name: 'Mongo', postgresPages: false, postgresSettings: false },
  { name: 'Postgres pages', postgresPages: true, postgresSettings: false },
  { name: 'Postgres settings', postgresPages: false, postgresSettings: true },
  { name: 'Postgres', postgresPages: true, postgresSettings: true },
];

export const pagesBackendPostgresMirror = (postgresSettings: boolean): string[] => [
  'pages',
  ...(postgresSettings ? ['settings'] : []),
];

export const applyPagesBackendFlags = (postgresPages: boolean, postgresSettings: boolean) => {
  testingTenants.changeCurrentTenant({
    featureFlags: { postgresPages, postgresSettings },
  });
};
