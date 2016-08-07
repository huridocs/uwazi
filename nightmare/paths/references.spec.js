import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import {login} from '../helpers/login.js';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

let getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
};

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
      .wait('.item-name')
      .evaluate(getInnerText, '.item:nth-child(2) .item-name')
      .then((itemName) => {
        return nightmare
        .type('input[type="text"]', itemName)
        .wait('.fa-arrow-left')
        .realClick('.fa-arrow-left')
        .wait('.page')
        .exists('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      })
      .catch(catchErrors(done));
    });

    it('select a word from the document, fill the form and click the submit button', (done) => {
      nightmare
      .realClick('.t:nth-child(4)')
      .realClick('.t:nth-child(4)')
      .wait('.fa-plus')
      .mouseover('.fa-plus')
      .wait('.float-btn.active')
      .realClick('.fa-paragraph')
      .wait('.create-reference.is-active')
      .select('select.form-control', 'a901de64992c1acddbbc2a930808377a')
      .type('.input-group input[type="text"]', '334 06 Egyptian Initiative')
      .wait(1000)
      .realClick('.item-group .item')
      .wait('.float-btn.btn-fixed')
      .realClick('.float-btn.btn-fixed')
      .wait('.document-viewer.show-target-document')
      .exists('.document-viewer.show-target-document')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should select a word from the second document then click the save button', (done) => {
      let textToSelect = '#pf1 > div.pc.pc1.w0.h0 > div.t.m0.x0.h3.y3.ff1.fs2.fc0.sc0.ls1.ws0';
      nightmare
      .wait(textToSelect)
      .realClick(textToSelect)
      .realClick(textToSelect)
      .wait('.fa-save')
      .realClick('.fa-save')
      .wait('.side-panel.document-references.is-active')
      .exists('.side-panel.document-references.is-active')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should find the document where the relation was created and open it', (done) => {
      nightmare
      .goto(config.url)
      .wait('.item-name')
      .evaluate(getInnerText, '.item:nth-child(2) .item-name')
      .then((itemName) => {
        return nightmare
        .type('input[type="text"]', itemName)
        .wait('.fa-arrow-left')
        .realClick('.fa-arrow-left')
        .wait('.page')
        .exists('.page')
        .then((result) => {
          expect(result).toBe(true);
          done();
        });
      })
      .catch(catchErrors(done));
    });

    it('select the word when the relation was created from the document then delete it', (done) => {
      let textToSelect = '.t:nth-child(4)';
      let unlinkIcon = '#app > div.content > div > div > aside.side-panel.document-references.is-active > div > div.item.relationship-active > div.item-actions > a:nth-child(1)';
      nightmare
      .realClick(textToSelect)
      .realClick(textToSelect)
      .wait(unlinkIcon)
      .click(unlinkIcon)
      .wait(3000)
      // .wait('.confirm-button')
      // .realclick('.confirm-button')
      // .then((result) => {
      //   expect(result).toBe(true);
      //   done();
      // })
      .then(done)
      .catch(catchErrors(done));
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
