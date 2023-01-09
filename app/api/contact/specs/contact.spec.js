/* eslint-disable max-nested-callbacks */
import mailer from 'api/utils/mailer';
import db from 'api/utils/testing_db';
import settings from 'api/settings';
import fixtures from './fixtures.js';
import contact from '../contact';

describe('contact', () => {
  beforeEach(async () => {
    jest.spyOn(mailer, 'send').mockImplementation(async () => Promise.resolve());
    await db.setupFixturesAndContext(fixtures);
  });

  afterAll(done => {
    db.disconnect().then(done);
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
