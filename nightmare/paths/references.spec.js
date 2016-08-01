import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import {login} from '../helpers/login.js';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

fdescribe('references path', () => {
  let nightmare = new Nightmare({show: true}).viewport(1100, 600);

  describe('login', () => {
    it('should log in as admin', (done) => {
      login(nightmare, 'admin', 'admin')
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('search for document', () => {
    it('should find a document then open it', (done) => {
      nightmare
        .wait('input[type="text"]')
        .type('input[type="text"]', '283 03 B Kenya')
        .wait('button[type="submit"]')
        .click('button[type="submit"]')
        .wait('.fa-file-o')
        .click('.fa-file-o')
        .wait('.page')
        .exist('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('select a word from the document then fill the form and click the submit button', (done) => {
        nightmare
        .realClick('.t span')
        .realClick('.t span')
        .wait('.fa-plus')
        .mouseover('.fa-plus')
        .wait('.float-btn.active')
        .realClick('.fa-paragraph')
        .wait('.create-reference .form-control')
        .select('.create-reference select', '2dfaea9e3d65a28015632d43ca3bae32')
        .type('.input-group input[type="text"]', '13 88 Hadjali Mohamad Algeria')
        .realClick('.item-group .item')
        .realClick('.float-btn.btn-fixed')
        .wait(1000)
        .wait('.fa-save')
        .exist('.fa-save')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('select a word from the second document then click the save button', (done) => {
        nightmare
        .realClick('.targetDocument .page .t:nth-child(2)')
        .realClick('.targetDocument .page .t:nth-child(2)')
        .realClick('.fa-save')
        .wait('.side-panel')
        .exist('.side-panel')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
