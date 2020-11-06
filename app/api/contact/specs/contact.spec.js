/* eslint-disable max-nested-callbacks */
import { catchErrors } from 'api/utils/jasmineHelpers';
import mailer from 'api/utils/mailer';
import db from 'api/utils/testing_db';
import fixtures from './fixtures.js';
import contact from '../contact';
import { settingsModel } from 'api/settings/settingsModel';

describe('contact', () => {
  beforeEach(done => {
    spyOn(mailer, 'send').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures)
      .then(done)
      .catch(catchErrors(done));
  });

  afterAll(done => {
    db.disconnect().then(done);
  });

  describe('sendMessage', () => {
    it('should send an email with the mailer to the configured email', async done => {
      contact
        .sendMessage({
          email: 'bruce@wayne.com',
          name: 'Bruce Wayne',
          message: 'I want to contact you.',
        })
        .then(() => {
          expect(mailer.send).toHaveBeenCalledWith({
            from: '"Uwazi" <no-reply@uwazi.io>',
            subject: 'Contact mesage from Bruce Wayne bruce@wayne.com',
            text: 'I want to contact you.',
            to: 'contact@uwazi.com',
          });
          done();
        })
        .catch(catchErrors(done));
    });
    it('should send email with the provided sender email and site name', async done => {
      const settings = {
        site_name: 'some site name',
        senderEmail: 'sender@email.com'
      };
      const set = await settingsModel.get();
      const updated = Object.assign(set[0], { ...settings });
      await settingsModel.save(updated);
      contact
        .sendMessage({
          email: 'bruce@wayne.com',
          name: 'Bruce Wayne',
          message: 'I want to contact you.',
        })
        .then(() => {
          expect(mailer.send).toHaveBeenCalledWith({
            from: `"${settings.site_name}" <${settings.senderEmail}>`,
            subject: 'Contact mesage from Bruce Wayne bruce@wayne.com',
            text: 'I want to contact you.',
            to: 'contact@uwazi.com',
          });
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
