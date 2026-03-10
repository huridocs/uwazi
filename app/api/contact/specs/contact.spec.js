/* eslint-disable max-nested-callbacks */
import settings from 'api/settings';
import mailer from 'api/utils/mailer';
import { testingEnvironment } from 'api/utils/testingEnvironment';
import contact from '../contact';
import fixtures from './fixtures.js';

describe('contact', () => {
  beforeEach(async () => {
    jest.spyOn(mailer, 'send').mockImplementation(async () => Promise.resolve());
    await testingEnvironment.setUp(fixtures);
  });

  afterAll(done => {
    testingEnvironment.tearDown().then(done);
  });

  describe('sendMessage', () => {
    it('should send an email with the mailer to the configured email', async () => {
      await contact.sendMessage({
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
      await settings.save(newSettings);
      await contact.sendMessage({
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
