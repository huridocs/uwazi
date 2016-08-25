import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

const settingsNavButton = '#app > div.content > header > div > div > ul > li:nth-child(3) > a';
const settingsHeader = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(1) > div.panel-heading';
const thesaurisButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(3)';
const documentsButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(1)';
const entitiesButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(4)';
const connectionsButton = '#app > div.content > div > div > div.col-xs-12.col-sm-4 > div > div:nth-child(2) > div.list-group > a:nth-child(2)';
const thesaurisBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > a';
const documentsBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > a';
const connectionsBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading.relationType > a';
const entitiesBackButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > a';
const addNewThesauri = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a';
const addNewDocument = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a';
const addNewEntity = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a';
const addNewConnection = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > div.panel-body > a > span';
const addNewValueToThesauriButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-body > a';
const firstThesauriValForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(2) > div > div > input';
const secondThesauriValForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > ul > li:nth-child(3) > div > div > input';
const saveThesauriButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading > button';
const saveDocumentButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > button';
const saveEntityButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > button';
const saveConnectionButton = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > form > div > div.panel-heading.relationType > button';
const thesauriNameForm = '#thesauriName';
const connectionNameForm = '#relationTypeName';
const entityNameForm = '#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > main > div > form > div > div > input';
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

      it('should go back to Thesauris then edit the created thesauri', (done) => {
        nightmare
        .wait(thesaurisBackButton)
        .realClick(thesaurisBackButton)
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
        .wait(thesauriNameForm)
        .type(thesauriNameForm, ' edited once')
        .wait(firstThesauriValForm)
        .type(firstThesauriValForm, ' edited once')
        .wait(secondThesauriValForm)
        .type(secondThesauriValForm, ' edited once')
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

      it('should go back to Documents then edit the created document', (done) => {
        nightmare
        .wait(documentsBackButton)
        .realClick(documentsBackButton)
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
        .wait(documentTemplateNameForm)
        .type(documentTemplateNameForm, ' edited once')
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
            if (documentTemplate.innerText.match('test document template edited once')) {
              itemFound = true;
            }
          });
          return itemFound;
        })
        .evaluate(() => {
          let documentTemplateList = document.querySelectorAll('#app > div.content > div > div > div.col-xs-12.col-sm-8 > div > ul li');
          documentTemplateList.forEach((documentTemplate) => {
            if (documentTemplate.innerText.match('test document template edited once')) {
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

    it('should click Connections button and then click on add new connection button', (done) => {
      nightmare
      .wait(connectionsButton)
      .realClick(connectionsButton)
      .wait(addNewConnection)
      .realClick(addNewConnection)
      .wait(saveConnectionButton)
      .exists(saveConnectionButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Connections', () => {
      it('should create a new connection', (done) => {
        nightmare
        .wait(connectionNameForm)
        .type(connectionNameForm, 'test connection')
        .wait(saveConnectionButton)
        .realClick(saveConnectionButton)
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
        .wait(connectionsBackButton)
        .realClick(connectionsBackButton)
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
        .wait(connectionNameForm)
        .type(connectionNameForm, ' edited once')
        .realClick(saveConnectionButton)
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
        .wait(connectionsBackButton)
        .realClick(connectionsBackButton)
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
        .wait(deleteButtonConfirmation)
        .realClick(deleteButtonConfirmation)
        .then(
          done
        )
        .catch(catchErrors(done));
      });
    });

    it('should click Entities button and then click on add new Entity button', (done) => {
      nightmare
      .wait(entitiesButton)
      .realClick(entitiesButton)
      .wait(addNewEntity)
      .realClick(addNewEntity)
      .wait(saveEntityButton)
      .exists(saveEntityButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('in Entities', () => {
      it('should create a new entity', (done) => {
        nightmare
        .wait(entityNameForm)
        .type(entityNameForm, 'test entity')
        .wait(saveEntityButton)
        .realClick(saveEntityButton)
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
        .wait(entitiesBackButton)
        .realClick(entitiesBackButton)
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
        .wait(entityNameForm)
        .type(entityNameForm, ' edited once')
        .realClick(saveEntityButton)
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
        .wait(entitiesBackButton)
        .realClick(entitiesBackButton)
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
