import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

const settingsNavButton = '#app > div.content > header > div > div > ul > li:nth-child(3) > a';
const settingsHeader = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(1) > div.panel-heading';
const thesaurisButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(3)';
const documentsButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(1)';
const thesaurisBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > a';
const documentsBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > a';
const addNewThesauri = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a';
const addNewDocument = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a';
const addNewValueToThesauriButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-body > a';
const firstThesauriValForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(2) > div > div > input';
const secondThesauriValForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(3) > div > div > input';
const saveThesauriButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > button';
const saveDocumentButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > button';
const thesauriNameForm = '#thesauriName';
const documentTemplateNameForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > div > input';
const deleteButtonConfirmation = 'body > div.ReactModalPortal > div > div > div > div.modal-footer > button.btn.confirm-button.btn-danger';

fdescribe('metadata path', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .realClick(settingsNavButton)
      .wait(settingsHeader)
      .url()
      .then((url) => {
        expect(url).toBe(config.url + '/settings/account');
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('in settings', () => {
    it('should click Thesauris button and then click on add new thesauri button', (done) => {
      nightmare
      .wait(thesaurisButton)
      .realClick(thesaurisButton)
      .wait(addNewThesauri)
      .realClick(addNewThesauri)
      .wait(saveThesauriButton)
      .exists(saveThesauriButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Thesauris', () => {
      it('should create a new thesauri with two values', (done) => {
        nightmare
        .wait(thesauriNameForm)
        .type(thesauriNameForm, 'test thesauri 1')
        .wait(addNewValueToThesauriButton)
        .realClick(addNewValueToThesauriButton)
        .wait(firstThesauriValForm)
        .type(firstThesauriValForm, 'tests value 1')
        .wait(addNewValueToThesauriButton)
        .realClick(addNewValueToThesauriButton)
        .wait(secondThesauriValForm)
        .type(secondThesauriValForm, 'tests value 2')
        .realClick(saveThesauriButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Thesauris then delete the created thesauri', (done) => {
        nightmare
        .wait(thesaurisBackButton)
        .realClick(thesaurisBackButton)
        .wait(() => {
          let itemFound = false;
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test')) {
              thesauri.querySelector('.fa-trash').click();
            }
          });
        })
        .wait(deleteButtonConfirmation)
        .realClick(deleteButtonConfirmation)
        .then(
          done
        )
        .catch(catchErrors(done));
      });
    });

    it('should click Documents button and then click on add new document button', (done) => {
      nightmare
      .wait(documentsButton)
      .realClick(documentsButton)
      .wait(addNewDocument)
      .realClick(addNewDocument)
      .wait(saveDocumentButton)
      .exists(saveDocumentButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Documents', () => {
      it('should create a new document template with no properties added', (done) => {
        //DRAG PROPERTIES AND DROP INTO TEMPLATE TO BE ADDED TO THIS TEST.
        nightmare
        .wait(documentTemplateNameForm)
        .type(documentTemplateNameForm, 'test document template')
        .wait(saveDocumentButton)
        .realClick(saveDocumentButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Documents then delete the created document template', (done) => {
        nightmare
        .wait(documentsBackButton)
        .realClick(documentsBackButton)
        .wait(() => {
          let itemFound = false;
          let documentTemplatesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentTemplatesList.forEach((documentTemplate) => {
            if (documentTemplate.innerText.match('test')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let documentTemplate = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentTemplate.forEach((documentTemplate) => {
            if (documentTemplate.innerText.match('test')) {
              documentTemplate.querySelector('.fa-trash').click();
            }
          });
        })
        .wait(deleteButtonConfirmation)
        .realClick(deleteButtonConfirmation)
        .then(
          done
        )
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
