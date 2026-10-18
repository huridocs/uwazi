import { testingTenants } from '#api/utils/testingTenants.js';

export const pagesBackendConfigs = [
  { name: 'Mongo', postgresCore: false },
  { name: 'Postgres', postgresCore: true },
];

export const pagesBackendPostgresMirror = (postgresCore: boolean): string[] =>
  postgresCore ? ['pages', 'settings', 'templates'] : [];

export const applyPagesBackendFlags = (postgresCore: boolean) => {
  testingTenants.changeCurrentTenant({
    featureFlags: { postgresCore },
  });
};
