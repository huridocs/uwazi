import { TestUtils } from '#api/common.v2/utils/Test.js';
import { SettingsDataSource } from '#api/core/application/contracts/SettingsDataSource.js';
import { User } from '#api/users.v2/model/User.js';
import { Settings } from '#shared/types/settingsType.js';
import { SettingsQueryService } from '../SettingsQueryService.js';

jest.mock('#api/tenants/index.js', () => ({
  tenants: {
    current: () => ({ featureFlags: { themeCustomization: true } }),
  },
}));

const stored = {
  site_name: 'Uwazi',
  mailerConfig: 'smtp://secret',
  contactEmail: 'admin@example.com',
  languages: [{ key: 'en', label: 'English', default: true }],
} as unknown as Settings;

const createSut = (actor?: User) => {
  const settingsDS = TestUtils.mockClass<SettingsDataSource>({
    find: jest.fn().mockResolvedValue(stored),
  });
  return {
    settingsDS,
    service: new SettingsQueryService(settingsDS, { actor }),
  };
};

describe('SettingsQueryService', () => {
  it('should return the admin projection from get() when the actor is an admin', async () => {
    const { service } = createSut(new User('u1', 'admin', []));

    const result = await service.get();

    expect(result.site_name).toBe('Uwazi');
    expect(result.mailerConfig).toBe('smtp://secret');
    expect(result.themeCustomization).toBe(true);
  });

  it('should return the public projection from get() for non-admin actors', async () => {
    const { service } = createSut(new User('u1', 'editor', []));

    const result = await service.get();

    expect(result.site_name).toBe('Uwazi');
    expect(result.mailerConfig).toBeUndefined();
    expect(result.themeCustomization).toBe(true);
  });

  it('should return the public projection from get() when there is no actor', async () => {
    const { service } = createSut();

    const result = await service.get();

    expect(result.mailerConfig).toBeUndefined();
  });

  it('should return the public projection from forBroadcast() even when the actor is an admin', async () => {
    const { service } = createSut(new User('u1', 'admin', []));

    const result = await service.forBroadcast();

    expect(result.site_name).toBe('Uwazi');
    expect(result.mailerConfig).toBeUndefined();
    expect(result.contactEmail).toBeUndefined();
    expect(result.themeCustomization).toBe(true);
  });
});
