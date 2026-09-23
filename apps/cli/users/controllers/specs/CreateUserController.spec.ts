import { ZodError } from 'zod';
import { UserRole } from '#api/core/domain/user/User.js';
import { UsernameExists } from '#api/core/domain/user/errors.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TenantDomainMissing } from '../../../tenancy/TenantDomainMissing.js';
import { CreatedUserOutputSchema } from '../../contracts.js';
import { CreateUserController } from '../CreateUserController.js';
import { asCli, backends, f, fixtures, stored, useBackend } from './fixtures.js';

const input = (overrides: Record<string, unknown> = {}) => ({
  username: 'newguy',
  email: 'newguy@test.com',
  role: UserRole.COLLABORATOR,
  groups: [],
  welcomeEmail: true,
  ...overrides,
});

describe.each(backends)('CreateUserController ($name)', ({ postgresCore }) => {
  const welcomeEmailJobs = async () =>
    (await stored(postgresCore, 'jobs')).filter(
      job =>
        job.name === 'SendWelcomeEmailHandler' && job.namespace === testingTenants.current().name
    );

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    await testingEnvironment.pg.pool!.query('DELETE FROM jobs');
    useBackend(postgresCore, { domain: 'tenant.test' });
  });

  it('should create the user and report it', async () => {
    const output = await asCli(async () =>
      CreateUserController.handle(input({ groups: [f.idString('Researchers')] }))
    );

    expect(CreatedUserOutputSchema.parse(output)).toEqual({
      user: {
        id: expect.any(String),
        username: 'newguy',
        email: 'newguy@test.com',
        role: 'collaborator',
      },
      welcomeEmailQueued: true,
    });
    expect(await stored(postgresCore, 'users')).toContainEqual(
      expect.objectContaining({ username: 'newguy', email: 'newguy@test.com' })
    );
  });

  it('should queue the welcome email with the tenant domain', async () => {
    const { user } = await asCli(async () => CreateUserController.handle(input()));

    expect(await welcomeEmailJobs()).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({ userId: user.id, domain: 'https://tenant.test' }),
      }),
    ]);
  });

  it('should skip the welcome email when asked', async () => {
    const output = await asCli(async () =>
      CreateUserController.handle(input({ welcomeEmail: false }))
    );

    expect(output.welcomeEmailQueued).toBe(false);
    expect(await welcomeEmailJobs()).toEqual([]);
  });

  it('should fail, creating nothing, when the tenant has no domain configured', async () => {
    useBackend(postgresCore, { domain: '' });

    await expect(asCli(async () => CreateUserController.handle(input()))).rejects.toThrow(
      TenantDomainMissing
    );
    expect((await stored(postgresCore, 'users')).map(u => u.username)).not.toContain('newguy');
  });

  it('should fail with a conflict for an existing username', async () => {
    await expect(
      asCli(async () => CreateUserController.handle(input({ username: 'editor' })))
    ).rejects.toThrow(UsernameExists);
  });

  it('should enforce the domain rules', async () => {
    await expect(
      asCli(async () => CreateUserController.handle(input({ username: 'new guy' })))
    ).rejects.toThrow(ZodError);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
