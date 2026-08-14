import { getFixturesFactory } from '#api/utils/fixturesFactory.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import { tenants } from '#api/tenants/index.js';
import { UserRole } from '#api/core/domain/user/User.js';
import { UserNotFound } from '#api/core/domain/user/errors.js';
import type { EmailMessage, EmailSender } from '#api/core/application/contracts/EmailSender.js';
import type {
  HeartbeatCallback,
  JobInfo,
} from '#api/core/libs/queue/application/contracts/Dispatchable.js';
import { SendAccountLockedEmailHandler } from '#api/core/infrastructure/jobs/SendAccountLockedEmailHandler.js';
import { SendPasswordRecoveryEmailHandler } from '#api/core/infrastructure/jobs/SendPasswordRecoveryEmailHandler.js';

const f = getFixturesFactory();

const recipient = f.user({
  username: 'recipient',
  role: UserRole.EDITOR,
  email: 'recipient@test.com',
});

const fixtures = { users: [recipient] };

/**
 * Both handlers resolve their recipient through UsersDirectory (plan 05). Nothing else
 * executes them — the controller specs only assert the job is queued — so this pins the two
 * things the swap could break: the address the email is actually sent to, and the failure
 * mode for a userId that resolves to nobody.
 */
describe('user email job handlers', () => {
  let sent: EmailMessage[];
  let emailSender: EmailSender;
  const heartbeat: HeartbeatCallback = jest.fn();
  let jobInfo: JobInfo;

  beforeEach(async () => {
    await testingEnvironment.setUp(fixtures);
    sent = [];
    emailSender = {
      send: async (message: EmailMessage) => {
        sent.push(message);
      },
    };
    jobInfo = { retryCount: 0, maxRetries: 3, namespace: tenants.current().name };
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('SendPasswordRecoveryEmailHandler', () => {
    it('should send the recovery link to the resolved user', async () => {
      const handler = new SendPasswordRecoveryEmailHandler({ emailSender });

      await handler.handleDispatch(
        heartbeat,
        { userId: f.idString('recipient'), domain: 'http://uwazi', key: 'recovery-key' },
        jobInfo
      );

      expect(sent).toEqual([
        expect.objectContaining({
          to: 'recipient@test.com',
          subject: 'Password recovery',
          text: expect.stringContaining('http://uwazi/setpassword/recovery-key'),
        }),
      ]);
      expect(sent[0].text).toContain('Your username is: recipient');
    });

    it('should fail the job rather than send when the user does not resolve', async () => {
      const handler = new SendPasswordRecoveryEmailHandler({ emailSender });

      await expect(
        handler.handleDispatch(
          heartbeat,
          { userId: f.idString('nonexistent'), domain: 'http://uwazi', key: 'recovery-key' },
          jobInfo
        )
      ).rejects.toThrow(UserNotFound);
      expect(sent).toEqual([]);
    });
  });

  describe('SendAccountLockedEmailHandler', () => {
    it('should send the unlock code to the resolved user', async () => {
      const handler = new SendAccountLockedEmailHandler({ emailSender });

      await handler.handleDispatch(
        heartbeat,
        { userId: f.idString('recipient'), domain: 'http://uwazi', unlockCode: 'unlock-code' },
        jobInfo
      );

      expect(sent).toEqual([
        expect.objectContaining({
          to: 'recipient@test.com',
          text: expect.stringContaining('unlock-code'),
        }),
      ]);
    });

    it('should fail the job rather than send when the user does not resolve', async () => {
      const handler = new SendAccountLockedEmailHandler({ emailSender });

      await expect(
        handler.handleDispatch(
          heartbeat,
          { userId: f.idString('nonexistent'), domain: 'http://uwazi', unlockCode: 'unlock-code' },
          jobInfo
        )
      ).rejects.toThrow(UserNotFound);
      expect(sent).toEqual([]);
    });
  });
});
