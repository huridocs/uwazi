/* eslint-disable max-nested-callbacks */
import { catchErrors } from 'api/utils/jasmineHelpers';
import mailer from 'api/utils/mailer';
import db from 'api/utils/testing_db';
import fixtures from './fixtures.js';
import contact from '../contact';

describe('contact', () => {
  beforeEach((done) => {
    spyOn(mailer, 'send').and.returnValue(Promise.resolve());
    db.clearAllAndLoad(fixtures).then(done).catch(catchErrors(done));
  });

  afterAll((done) => {
    db.disconnect().then(done);
  });

  describe('sendMessage', () => {
    it('should send an email with the mailer to the configured email', (done) => {
      contact.sendMessage({ email: 'bruce@wayne.com', name: 'Bruce Wayne', text: 'I want to contact you.' })
      .then(() => {
        expect(mailer.send).toHaveBeenCalledWith({
          from: '"Bruce Wayne" <bruce@wayne.com',
          subject: 'Contact form',
          text: 'I want to contact you.',
          to: 'contact@uwazi.com'
        });
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
