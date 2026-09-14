/* eslint-disable max-nested-callbacks */
import { SaveSettingsUseCaseFactory } from '#api/core/infrastructure/factories/SaveSettingsUseCaseFactory.js';
import mailer from '#api/utils/mailer.js';
import { testingEnvironment } from '#api/utils/testingEnvironment.js';
import contact from '../contact.js';
import fixtures from './fixtures.js';

describe('contact', () => {
  beforeEach(async () => {
    jest.spyOn(mailer, 'send').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(async () => {
    await testingEnvironment.tearDown();
  });

  describe('sendMessage', () => {
    const sendMessage = async message =>
      testingEnvironment.runWithContext(async () => contact.sendMessage(message));

    it('should send an email with the mailer to the configured email', async () => {
      await sendMessage({
        email: 'bruce@wayne.com',
        name: 'Bruce Wayne',
        message: 'I want to contact you.',
      });
      expect(mailer.send).toHaveBeenCalledWith({
        from: '"Uwazi" <no-reply@uwazi.io>',
        subject: 'Contact mesage from Bruce Wayne bruce@wayne.com',
        text: 'I want to contact you.',
        to: 'contact@uwazi.com',
      });
    });
    it('should send email with the provided sender email and site name', async () => {
      const newSettings = {
        site_name: 'some site name',
        senderEmail: 'sender@email.com',
      };
      await testingEnvironment.runWithContext(async () =>
        SaveSettingsUseCaseFactory.default().execute(newSettings)
      );
      await sendMessage({
        email: 'bruce@wayne.com',
        name: 'Bruce Wayne',
        message: 'I want to contact you.',
      });
      expect(mailer.send).toHaveBeenCalledWith({
        from: `"${newSettings.site_name}" <${newSettings.senderEmail}>`,
        subject: 'Contact mesage from Bruce Wayne bruce@wayne.com',
        text: 'I want to contact you.',
        to: 'contact@uwazi.com',
      });
    });
  });
});
