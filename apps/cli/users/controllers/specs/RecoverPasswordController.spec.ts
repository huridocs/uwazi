import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { testingTenants } from '#api/utils/testingTenants.js';
import { TenantDomainMissing } from '../../../tenancy/TenantDomainMissing.js';
import { RecoveryRequestedOutputSchema } from '../../contracts.js';
import { RecoverPasswordController } from '../RecoverPasswordController.js';
import { ControllerSpecs } from '../../../testing/ControllerSpecs.js';
import { f, fixtures } from './fixtures.js';

describe.each(ControllerSpecs.backends)('RecoverPasswordController ($name)', ({ postgresCore }) => {
  const recoveryEmailJobs = async () =>
    (await ControllerSpecs.stored(postgresCore, 'jobs')).filter(
      job =>
        job.name === 'SendPasswordRecoveryEmailHandler' &&
        job.namespace === testingTenants.current().name
    );

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures, { postgres: true });
    await testingEnvironment.pg.pool!.query('DELETE FROM jobs');
    ControllerSpecs.useBackend(postgresCore, { domain: 'tenant.test' });
  });

  it('should queue the recovery email with the tenant domain and report it', async () => {
    const output = await ControllerSpecs.asCli(async () =>
      RecoverPasswordController.handle({ email: 'editor@test.com' })
    );

    expect(RecoveryRequestedOutputSchema.strict().parse(output)).toEqual({
      recoveryEmailQueued: true,
    });
    expect(await recoveryEmailJobs()).toEqual([
      expect.objectContaining({
        params: expect.objectContaining({
          userId: f.idString('editor'),
          domain: 'https://tenant.test',
        }),
      }),
    ]);
  });

  it('should report that nothing was queued for an email no active user has', async () => {
    const output = await ControllerSpecs.asCli(async () =>
      RecoverPasswordController.handle({ email: 'gone@test.com' })
    );

    expect(output).toEqual({ recoveryEmailQueued: false });
    expect(await recoveryEmailJobs()).toEqual([]);
  });

  it('should fail, queuing nothing, when the tenant has no domain configured', async () => {
    ControllerSpecs.useBackend(postgresCore, { domain: '' });

    await expect(
      ControllerSpecs.asCli(async () =>
        RecoverPasswordController.handle({ email: 'editor@test.com' })
      )
    ).rejects.toThrow(TenantDomainMissing);
    expect(await recoveryEmailJobs()).toEqual([]);
  });
});

afterAll(async () => {
  await testingEnvironment.tearDown();
});
