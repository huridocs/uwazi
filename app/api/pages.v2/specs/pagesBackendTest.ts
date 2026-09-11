import { testingTenants } from '#api/utils/testingTenants.js';

export const pagesBackendConfigs = [
  { name: 'Mongo', postgresPages: false, postgresCore: false },
  { name: 'Postgres pages', postgresPages: true, postgresCore: false },
  { name: 'Postgres core', postgresPages: false, postgresCore: true },
  { name: 'Postgres', postgresPages: true, postgresCore: true },
];

export const pagesBackendPostgresMirror = (postgresCore: boolean): string[] => [
  'pages',
  ...(postgresCore ? ['settings', 'templates'] : []),
];

export const applyPagesBackendFlags = (postgresPages: boolean, postgresCore: boolean) => {
  testingTenants.changeCurrentTenant({
    featureFlags: { postgresPages, postgresCore },
  });
};
