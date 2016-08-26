import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

describe('metadata path', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 10}).viewport(1100, 600);

  describe('login', () => {
    it('should log in as admin then click the settings nav button', (done) => {
      nightmare
      .login('admin', 'admin')
      .waitToClick(selectors.settingsView.settingsNavButton)
      .wait(selectors.settingsView.settingsHeader)
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
      .waitToClick(selectors.settingsView.thesaurisButton)
      .waitToClick(selectors.settingsView.addNewThesauri)
      .wait(selectors.settingsView.saveThesauriButton)
      .exists(selectors.settingsView.saveThesauriButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Thesauris', () => {
      it('should create a new thesauri with two values', (done) => {
        nightmare
        .wait(selectors.settingsView.thesauriNameForm)
        .type(selectors.settingsView.thesauriNameForm, 'test thesauri 1')
        .waitToClick(selectors.settingsView.addNewValueToThesauriButton)
        .wait(selectors.settingsView.firstThesauriValForm)
        .type(selectors.settingsView.firstThesauriValForm, 'tests value 1')
        .waitToClick(selectors.settingsView.addNewValueToThesauriButton)
        .wait(selectors.settingsView.secondThesauriValForm)
        .type(selectors.settingsView.secondThesauriValForm, 'tests value 2')
        .waitToClick(selectors.settingsView.saveThesauriButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Thesauris then edit the created thesauri', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.thesaurisBackButton)
        .wait(() => {
          let itemFound = false;
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test thesauri 1')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test thesauri 1')) {
              thesauri.querySelector('.fa-pencil').click();
            }
          });
        })
        .wait(selectors.settingsView.thesauriNameForm)
        .type(selectors.settingsView.thesauriNameForm, ' edited once')
        .wait(selectors.settingsView.firstThesauriValForm)
        .type(selectors.settingsView.firstThesauriValForm, ' edited once')
        .wait(selectors.settingsView.secondThesauriValForm)
        .type(selectors.settingsView.secondThesauriValForm, ' edited once')
        .waitToClick(selectors.settingsView.saveThesauriButton)
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
        .waitToClick(selectors.settingsView.thesaurisBackButton)
        .wait(() => {
          let itemFound = false;
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test thesauri 1 edited once')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let thesaurisList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          thesaurisList.forEach((thesauri) => {
            if (thesauri.innerText.match('test thesauri 1 edited once')) {
              thesauri.querySelector('.fa-trash').click();
            }
          });
        })
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(
          done
        )
        .catch(catchErrors(done));
      });
    });

    it('should click Documents button and then click on add new document button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.documentsButton)
      .waitToClick(selectors.settingsView.addNewDocument)
      .wait(selectors.settingsView.saveDocumentButton)
      .exists(selectors.settingsView.saveDocumentButton)
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
        .wait(selectors.settingsView.documentTemplateNameForm)
        .type(selectors.settingsView.documentTemplateNameForm, 'test document template')
        .waitToClick(selectors.settingsView.saveDocumentButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Documents then edit the created document', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.documentsBackButton)
        .wait(() => {
          let itemFound = false;
          let documentsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentsList.forEach((oneDocument) => {
            if (oneDocument.innerText.match('test document template')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let documentsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentsList.forEach((oneDocument) => {
            if (oneDocument.innerText.match('test document template')) {
              oneDocument.querySelector('.fa-pencil').click();
            }
          });
        })
        .wait(selectors.settingsView.documentTemplateNameForm)
        .type(selectors.settingsView.documentTemplateNameForm, ' edited once')
        .waitToClick(selectors.settingsView.saveDocumentButton)
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
        .waitToClick(selectors.settingsView.documentsBackButton)
        .wait(() => {
          let itemFound = false;
          let documentTemplatesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentTemplatesList.forEach((documentTemplate) => {
            if (documentTemplate.innerText.match('test document template edited once')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let documentTemplatesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentTemplatesList.forEach((documentTemplate) => {
            if (documentTemplate.innerText.match('test document template edited once')) {
              documentTemplate.querySelector('.fa-trash').click();
            }
          });
        })
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(
          done
        )
        .catch(catchErrors(done));
      });
    });

    it('should click Connections button and then click on add new connection button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.connectionsButton)
      .waitToClick(selectors.settingsView.addNewConnection)
      .wait(selectors.settingsView.saveConnectionButton)
      .exists(selectors.settingsView.saveConnectionButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Connections', () => {
      it('should create a new connection', (done) => {
        nightmare
        .wait(selectors.settingsView.connectionNameForm)
        .type(selectors.settingsView.connectionNameForm, 'test connection')
        .waitToClick(selectors.settingsView.saveConnectionButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Connections then edit the created connection', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.connectionsBackButton)
        .wait(() => {
          let itemFound = false;
          let connectionsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          connectionsList.forEach((connection) => {
            if (connection.innerText.match('test connection')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let connectionsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          connectionsList.forEach((connection) => {
            if (connection.innerText.match('test connection')) {
              connection.querySelector('.fa-pencil').click();
            }
          });
        })
        .wait(selectors.settingsView.connectionNameForm)
        .type(selectors.settingsView.connectionNameForm, ' edited once')
        .waitToClick(selectors.settingsView.saveConnectionButton)
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
        .waitToClick(selectors.settingsView.connectionsBackButton)
        .wait(() => {
          let itemFound = false;
          let connectionsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          connectionsList.forEach((connection) => {
            if (connection.innerText.match('test connection edited once')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let connectionsList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          connectionsList.forEach((connection) => {
            if (connection.innerText.match('test connection edited once')) {
              connection.querySelector('.fa-trash').click();
            }
          });
        })
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
        .then(
          done
        )
        .catch(catchErrors(done));
      });
    });

    it('should click Entities button and then click on add new Entity button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.entitiesButton)
      .waitToClick(selectors.settingsView.addNewEntity)
      .wait(selectors.settingsView.saveEntityButton)
      .exists(selectors.settingsView.saveEntityButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Entities', () => {
      it('should create a new entity', (done) => {
        nightmare
        .wait(selectors.settingsView.entityNameForm)
        .type(selectors.settingsView.entityNameForm, 'test entity')
        .waitToClick(selectors.settingsView.saveEntityButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Entities then edit the created entity', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.entitiesBackButton)
        .wait(() => {
          let itemFound = false;
          let entitiesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          entitiesList.forEach((entity) => {
            if (entity.innerText.match('test entity')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let entitiesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          entitiesList.forEach((entity) => {
            if (entity.innerText.match('test entity')) {
              entity.querySelector('.fa-pencil').click();
            }
          });
        })
        .wait(selectors.settingsView.entityNameForm)
        .type(selectors.settingsView.entityNameForm, ' edited once')
        .waitToClick(selectors.settingsView.saveEntityButton)
        .wait('.alert.alert-success')
        .exists('.alert.alert-success')
        .then((result) => {
          expect(result).toBe(true);
          done();
        })
        .catch(catchErrors(done));
      });

      it('should go back to Entities then delete the created entity', (done) => {
        nightmare
        .waitToClick(selectors.settingsView.entitiesBackButton)
        .wait(() => {
          let itemFound = false;
          let entitiesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          entitiesList.forEach((entity) => {
            if (entity.innerText.match('test entity edited once')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let entitiesList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          entitiesList.forEach((entity) => {
            if (entity.innerText.match('test entity edited once')) {
              entity.querySelector('.fa-trash').click();
            }
          });
        })
        .waitToClick(selectors.settingsView.deleteButtonConfirmation)
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
