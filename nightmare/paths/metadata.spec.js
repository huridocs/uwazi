/*eslint max-nested-callbacks: ["error", 10]*/
import Nightmare from 'nightmare';
import realMouse from 'nightmare-real-mouse';
import config from '../helpers/config.js';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

realMouse(Nightmare);

fdescribe('metadata path', () => {
  let nightmare = new Nightmare({show: true, typeInterval: 20}).viewport(1100, 600);

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

  describe('Dictionaries tests', () => {
    it('should click dictionaries button and then click on add new dictionary button', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.dictionariesButton)
      .waitToClick(selectors.settingsView.addNewDictionary)
      .wait(selectors.settingsView.saveDictionaryButton)
      .exists(selectors.settingsView.saveDictionaryButton)
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should create a new dictionary with two values', (done) => {
      nightmare
      .wait(selectors.settingsView.dictionaryNameForm)
      .type(selectors.settingsView.dictionaryNameForm, 'test dictionary')
      .waitToClick(selectors.settingsView.addNewValueToDictionaryButton)
      .wait(selectors.settingsView.firstDictionaryValForm)
      .type(selectors.settingsView.firstDictionaryValForm, 'tests value 1')
      .waitToClick(selectors.settingsView.addNewValueToDictionaryButton)
      .wait(selectors.settingsView.secondDictionaryValForm)
      .type(selectors.settingsView.secondDictionaryValForm, 'tests value 2')
      .waitToClick(selectors.settingsView.saveDictionaryButton)
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should go back to dictionaries then edit the created dictionary', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.dictionariesBackButton)
      .wait(selectors.settingsView.liElementsOfSection)
      .editItemFromList('test')
      .wait(selectors.settingsView.dictionaryNameForm)
      .type(selectors.settingsView.dictionaryNameForm, ' edited')
      .wait(selectors.settingsView.firstDictionaryValForm)
      .type(selectors.settingsView.firstDictionaryValForm, ' edited')
      .wait(selectors.settingsView.secondDictionaryValForm)
      .type(selectors.settingsView.secondDictionaryValForm, ' edited')
      .waitToClick(selectors.settingsView.saveDictionaryButton)
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should go back to dictionaries then delete the created dictionary', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.dictionariesBackButton)
      .deleteItemFromList('edited')
      .waitToClick(selectors.settingsView.deleteButtonConfirmation)
      .then(done)
      .catch(catchErrors(done));
    });
  });

  describe('Documents tests', () => {
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

    it('should create a new document template with no properties added', (done) => {
      //DRAG PROPERTIES AND DROP INTO TEMPLATE TO BE ADDED TO THIS TEST.
      nightmare
      .wait(selectors.settingsView.documentTemplateNameForm)
      .type(selectors.settingsView.documentTemplateNameForm, 'test document')
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
      .wait(selectors.settingsView.liElementsOfSection)
      .editItemFromList('test')
      .wait(selectors.settingsView.entityNameForm)
      .type(selectors.settingsView.entityNameForm, ' edited')
      .waitToClick(selectors.settingsView.saveEntityButton)
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
      .deleteItemFromList('edited')
      .waitToClick(selectors.settingsView.deleteButtonConfirmation)
      .then(done)
      .catch(catchErrors(done));
    });
  });

  describe('Connections tests', () => {
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
      .wait(selectors.settingsView.liElementsOfSection)
      .editItemFromList('test')
      .wait(selectors.settingsView.connectionNameForm)
      .type(selectors.settingsView.connectionNameForm, ' edited')
      .waitToClick(selectors.settingsView.saveConnectionButton)
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });

    it('should go back to connections then delete the created connection', (done) => {
      nightmare
      .waitToClick(selectors.settingsView.connectionsBackButton)
      .wait(selectors.settingsView.liElementsOfSection)
      .deleteItemFromList('edited')
      .waitToClick(selectors.settingsView.deleteButtonConfirmation)
      .then(done)
      .catch(catchErrors(done));
    });
  });

  describe('Entities tests', () => {
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

    it('should create a new entity', (done) => {
      nightmare
      .wait(selectors.settingsView.entityNameForm)
      .type(selectors.settingsView.entityNameForm, 'test entity')
      .click(selectors.settingsView.saveEntityButton)
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
      .wait(selectors.settingsView.liElementsOfSection)
      .editItemFromList('test')
      .wait(selectors.settingsView.entityNameForm)
      .type(selectors.settingsView.entityNameForm, ' edited')
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
      .wait(selectors.settingsView.liElementsOfSection)
      .deleteItemFromList('edited')
      .waitToClick(selectors.settingsView.deleteButtonConfirmation)
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
