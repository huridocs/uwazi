import { ProvisionEntityAccessPolicyUseCaseFactory } from '#api/core/infrastructure/factories/ProvisionEntityAccessPolicyUseCaseFactory.js';
import { ProvisionEntityAccessPolicyOnCreationListener } from '../ProvisionEntityAccessPolicyOnCreationListener.js';

describe('ProvisionEntityAccessPolicyOnCreationListener', () => {
  const executeSpy = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.spyOn(ProvisionEntityAccessPolicyUseCaseFactory, 'default').mockReturnValue({
      execute: executeSpy,
    } as any);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('calls the use case with sharedId and creatorId from the event payload', async () => {
    const listener = new ProvisionEntityAccessPolicyOnCreationListener({});

    // Set params directly (as handleDispatch would) and invoke handle() without
    // running the full UserAwareDispatchable tenant/user setup machinery.
    (listener as any).params = {
      sharedId: 'entity-42',
      userId: 'user-99',
      tenantName: 'test-tenant',
    };
    await (listener as any).handle();

    expect(executeSpy).toHaveBeenCalledWith({
      sharedId: 'entity-42',
      creatorId: 'user-99',
    });
  });

  it('is registered for EntityCreatedEvent', () => {
    expect(ProvisionEntityAccessPolicyOnCreationListener.eventName).toBe('EntityCreatedEvent');
  });
});
