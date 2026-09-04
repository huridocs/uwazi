import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { ExecutionContext } from '#api/core/libs/ExecutionContext.js';
import { BroadcastSettingsChanged } from '../BroadcastSettingsChanged.js';

const payload = { site_name: 'Public', themeCustomization: false };

const createSut = () => {
  const settingsQuery = {
    forBroadcast: jest.fn().mockResolvedValue(payload),
    get: jest.fn(),
  };
  const sockets = {
    emitToTenant: jest.fn(),
  };
  const listener = new BroadcastSettingsChanged({
    settingsQuery: settingsQuery as never,
    sockets: sockets as never,
  });
  return { listener, settingsQuery, sockets };
};

describe('BroadcastSettingsChanged', () => {
  it('should emit public settings to the current tenant without resolving by actor', async () => {
    const { listener, settingsQuery, sockets } = createSut();

    await testingEnvironment.runWithContext(async () => {
      await listener.handle(jest.fn() as never, {}, {} as never);
      expect(sockets.emitToTenant).toHaveBeenCalledWith(
        ExecutionContext.tenant.name,
        'updateSettings',
        payload
      );
    });

    expect(settingsQuery.forBroadcast).toHaveBeenCalled();
    expect(settingsQuery.get).not.toHaveBeenCalled();
  });
});
