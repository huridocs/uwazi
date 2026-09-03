import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { SettingsDataSourceFactory } from '../SettingsDataSourceFactory.js';
import { SaveSettingsUseCaseFactory } from '../SaveSettingsUseCaseFactory.js';
import { SetDefaultLanguageUseCaseFactory } from '../SetDefaultLanguageUseCaseFactory.js';
import { UpdateFilterNameUseCaseFactory } from '../UpdateFilterNameUseCaseFactory.js';
import { RemoveTemplateFromFiltersUseCaseFactory } from '../RemoveTemplateFromFiltersUseCaseFactory.js';
import { SaveMenuItemsUseCaseFactory } from '../SaveMenuItemsUseCaseFactory.js';
import { AddLanguageUseCaseFactory } from '../AddLanguageUseCaseFactory.js';
import { DeleteLanguageUseCaseFactory } from '../DeleteLanguageUseCaseFactory.js';

type FactoryDeps = {
  transactionManager: unknown;
  settingsDS?: { transactionManager?: unknown };
  translationsService?: { deps?: { transactionManager?: unknown } };
  saveSettings?: object;
};

const depsOf = (uc: object): FactoryDeps => (uc as unknown as { deps: FactoryDeps }).deps;

const factories = [
  ['SaveSettingsUseCaseFactory', () => SaveSettingsUseCaseFactory.default()],
  ['SetDefaultLanguageUseCaseFactory', () => SetDefaultLanguageUseCaseFactory.default()],
  ['UpdateFilterNameUseCaseFactory', () => UpdateFilterNameUseCaseFactory.default()],
  [
    'RemoveTemplateFromFiltersUseCaseFactory',
    () => RemoveTemplateFromFiltersUseCaseFactory.default(),
  ],
  ['SaveMenuItemsUseCaseFactory', () => SaveMenuItemsUseCaseFactory.default()],
  ['AddLanguageUseCaseFactory', () => AddLanguageUseCaseFactory.default()],
  ['DeleteLanguageUseCaseFactory', () => DeleteLanguageUseCaseFactory.default()],
] as const;

const assertDepsUseContext = (deps: FactoryDeps, fromContext: unknown) => {
  expect(deps.transactionManager === fromContext).toBe(true);
  if (deps.settingsDS && 'transactionManager' in deps.settingsDS) {
    expect(deps.settingsDS.transactionManager === fromContext).toBe(true);
  }
  if (deps.translationsService?.deps) {
    expect(deps.translationsService.deps.transactionManager === fromContext).toBe(true);
  }
  if (deps.saveSettings) {
    expect(depsOf(deps.saveSettings).transactionManager === fromContext).toBe(true);
  }
};

const assertFactoryUsesContextWithoutDrilling = (create: () => object) => {
  const fromContext = ExecutionContext.transactionManager;
  const dsSpy = jest.spyOn(SettingsDataSourceFactory, 'default');
  const uc = create();
  assertDepsUseContext(depsOf(uc), fromContext);
  const drilled = dsSpy.mock.calls.some(
    ([overrides]) => overrides?.transactionManager !== undefined
  );
  dsSpy.mockRestore();
  expect(drilled).toBe(false);
};

describe('Settings use case factories', () => {
  beforeAll(async () => {
    await testingEnvironment.setUp({ settings: [{ site_name: 'Factory TM' }] });
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  it.each(factories)(
    '%s should use ExecutionContext.transactionManager and not drill it into SettingsDataSourceFactory',
    (_name, create) => {
      testingEnvironment.runWithContext(() => assertFactoryUsesContextWithoutDrilling(create));
    }
  );
});
