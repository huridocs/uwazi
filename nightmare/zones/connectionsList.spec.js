/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 500]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

selectors.docForConnections = {
  form: {
    knownAccomplices: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > select',
    danerylAlly: '#metadataForm > div:nth-child(4) > div:nth-child(4) > ul > li.wide > ul > li:nth-child(2) > label'
  }
};

selectors.editingTemplate = {
  alliesNameInput: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(6) > div.propery-form.expand > div > div:nth-child(1) > div > input',
  alliesEditButton: '#app > div.content > div > div > div.settings-content > div > div > div.panel-body > div > main > div > form > ul > li:nth-child(6) > div.list-group-item-actions > button.btn.btn-default.btn-xs.property-edit'
};

describe('ConnectionsList zone', () => {
  it('should log in as admin', (done) => {
    nightmare
    .login('admin', 'admin')
    .wait(selectors.libraryView.libraryFirstDocument)
    .then(() => {
      done();
    })
    .catch(catchErrors(done));
  }, 10000);

  it('should create some connections via editing selects/multiselects in metadata', (done) => {
    nightmare
    .clickCardOnLibrary('Man-bat')
    .click(selectors.libraryView.editEntityButton)
    .select(selectors.docForConnections.form.knownAccomplices, '86raxe05i4uf2yb9')
    .click(selectors.libraryView.saveButton)
    .wait(selectors.libraryView.editEntityButton)
    .clickCardOnLibrary('Batman Wikipedia')
    .click(selectors.libraryView.editEntityButton)
    .waitToClick(selectors.docForConnections.form.danerylAlly)
    .click(selectors.libraryView.saveButton)
    .wait(selectors.libraryView.editEntityButton)
    .clickCardOnLibrary('Star Lord Wikipedia')
    .click(selectors.libraryView.editEntityButton)
    .waitToClick(selectors.docForConnections.form.danerylAlly)
    .click(selectors.libraryView.saveButton)
    .then(done);
  }, 10000);

  it('should go to daneryl and check if the connections exists', (done) => {
    nightmare
    .openEntityFromLibrary('Daneryl')
    .waitToClick(selectors.entityView.conectionsTabLink)
    .waitForTheEntityToBeIndexed()
    .getResultsAsJson()
    .then((results) => {
      expect(results.length).toBe(3);
      expect(results[0].title).toBe('Man-bat');
      expect(results[0].connectionType).toMatch('known accomplices');
      expect(results[1].title).toBe('Batman Wikipedia');
      expect(results[1].connectionType).toMatch('Allies');
      expect(results[2].title).toBe('Star Lord Wikipedia');
      expect(results[2].connectionType).toMatch('Allies');
      done();
    })
    .catch(catchErrors(done));
  });

  describe('when changing the name of a property that is being used to create connections', () => {
    it('should properly update the connection', (done) => {
      nightmare
      .click(selectors.navigation.settingsNavButton)
      .waitToClick(selectors.settingsView.documentsButton)
      .editItemFromList(selectors.settingsView.liElementsOfSection, 'Comic character')
      .waitToClick(selectors.editingTemplate.alliesEditButton)
      .write(selectors.editingTemplate.alliesNameInput, 'edited')
      .click(selectors.settingsView.saveDocumentButton)
      .gotoLibrary()
      .openEntityFromLibrary('Daneryl')
      .waitToClick(selectors.entityView.conectionsTabLink)
      .waitForTheEntityToBeIndexed()
      .getResultsAsJson()
      .then((results) => {
        expect(results.length).toBe(3);
        expect(results[0].title).toBe('Man-bat');
        expect(results[0].connectionType).toMatch('known accomplices');
        expect(results[1].title).toBe('Batman Wikipedia');
        expect(results[1].connectionType).toMatch('Alliesedited');
        expect(results[2].title).toBe('Star Lord Wikipedia');
        expect(results[2].connectionType).toMatch('Alliesedited');
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });


  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
