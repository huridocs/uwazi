import Nightmare from 'nightmare';
import {login} from './helpers/login.js';
import config from './helpers/config.js';


fdescribe('Smoke test', () => {
  let nightmare = new Nightmare({show: true}).viewport(1100, 600);

  // let getInnerText = (selector) => {
  //   return document.querySelector(selector).innerText;
  // };

  // let catchError = (done) => {
  //   return (error) => {
  //     expect(error).toBe(null);
  //     done();
  //   };
  // };

  describe('login success', () => {
    it('should redirect to home page', (done) => {
      login(nightmare, 'admin', 'admin')
      .url()
      .then((url) => {
        expect(url).toBe('http://localhost:3000/');
        done();
      });
    });
  });

  describe('my_account', () => {
    it('should check if user/admin nav button works', (done) => {
      nightmare
      .click('.fa-user')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe('http://localhost:3000/my_account');
        done();
      });
    });
  });

  describe('uploads', () => {
    it('should check if uploads nav button works', (done) => {
      nightmare
      .click('a[href="/uploads"]')
      .wait(config.waitTime)
      .url()
      .then((url) => {
        expect(url).toBe('http://localhost:3000/uploads');
        done();
      });
    });

    describe('when the user clicks in a document', () => {
      it('a side panel with the metadata form appears, then close it by clicking on the same document', () => {
        nightmare
        .click('.document-viewer .item-name')
        .wait(config.waitTime)
        .click('.document-viewer .item-name')
        .wait(config.waitTime);
      });

      it('a side panel with the metadata form appears, then close it by clicking on the panel cross', () => {
        nightmare
        .click('.document-viewer .item-name')
        .wait(config.waitTime)
        .click('.side-panel .close-modal')
        .wait(config.waitTime);
      });

      it('a side panel with the metadata form appears, click on the next document then close it', () => {
        nightmare
        .click('.document-viewer .item-name')
        .click('.document-viewer li:nth-child(2) .item-name')
        .click('.side-panel .close-modal')
        .wait(config.waitTime);
      });

      it('a side panel with the metadata form appears, click the gear drop down menu', () => {
        nightmare
        .click('.document-viewer .item-name')
        .wait(config.waitTime)
        .mouseover('.fa-gears')
        .wait(config.waitTime)
        .click('.side-panel .close-modal')
        .wait(config.waitTime);
      });
    });
    describe('item-metadata', () => {
      describe('when the user clicks the document-metadata of a document', () => {
        it('a window showing the status of a document should appear', () => {
          nightmare
          .click('.item-metadata')
          .click('.cancel-button')
          .wait(config.waitTime);
        });
      });
    });
  });

  it('should close the browser', (done) => {
    nightmare.end()
    .then(done);
  });
});
