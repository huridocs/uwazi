/*eslint max-nested-callbacks: ["error", 10]*/
import selectors from '../helpers/selectors.js';
import config from '../helpers/config.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('multi edit path', () => {
  describe('creating entities for the test', () => {
    describe('login', () => {
      it('it should create 3 entities', (done) => {
        nightmare
        .login('admin', 'admin')
        .waitToClick(selectors.navigation.uploadsNavButton)
        .wait(selectors.uploadsView.newEntityButtom)
        .url()
        .then((url) => {
          expect(url.match(config.url + '/uploads')).not.toBe(null);
          done();
        })
        .catch(catchErrors(done));
      }, 10000);
    });

    it('should create 3 new entities and publish them', (done) => {
      nightmare
      .click(selectors.uploadsView.newEntityButtom)
      .type(selectors.newEntity.form.title, 'King Ping')
      .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
      .click(selectors.uploadsView.saveButton)
      .waitToClick('.alert.alert-success')
      .click(selectors.uploadsView.newEntityButtom)
      .type(selectors.newEntity.form.title, 'Mysterio')
      .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
      .click(selectors.uploadsView.saveButton)
      .waitToClick('.alert.alert-success')
      .click(selectors.uploadsView.newEntityButtom)
      .type(selectors.newEntity.form.title, 'Dormmamu')
      .select(selectors.newEntity.form.type, '58ad7d240d44252fee4e61fb')
      .click(selectors.uploadsView.saveButton)
      .wait('.alert.alert-success')
      .exists('.alert.alert-success')
      .then((result) => {
        expect(result).toBe(true);
        done();
      });
    });
  });

  describe('editing different types', () => {
    it('should render a form with comon properties', (done) => {
      nightmare.click(selectors.libraryView.libraryFirstDocument)
      .shiftClick(selectors.libraryView.libraryThirdDocument)
      .click(selectors.libraryView.libraryMultiEditEditButton)
      .wait(selectors.libraryView.libraryMultiEditFormOption)
      .click(selectors.libraryView.libraryMultiEditFormOption)
      .click(selectors.libraryView.libraryMultiEditSaveButton)
      .waitForTheEntityToBeIndexed()
      .click(selectors.libraryView.libraryFirstDocument)
      .getInnerText(selectors.libraryView.libraryMetadataPanel)
      .then((text) => {
        expect(text.match('create chaos')).not.toBe(null);
        return nightmare.click(selectors.libraryView.librarySecondDocument)
        .getInnerText(selectors.libraryView.libraryMetadataPanel);
      })
      .then((text) => {
        expect(text.match('create chaos')).not.toBe(null);
        return nightmare.click(selectors.libraryView.libraryThirdDocument)
        .wait(selectors.libraryView.libraryMetadataPanel)
        .getInnerText(selectors.libraryView.libraryMetadataPanel);
      })
      .then((text) => {
        expect(text.match('create chaos')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  it('should publish the entities', (done) => {
    nightmare.waitToClick(selectors.uploadsView.firstPublishButton)
    .waitToClick(selectors.uploadsView.acceptPublishModel)
    .waitToClick('.alert.alert-success')
    .waitToClick(selectors.uploadsView.firstPublishButton)
    .waitToClick(selectors.uploadsView.acceptPublishModel)
    .waitToClick('.alert.alert-success')
    .waitToClick(selectors.uploadsView.firstPublishButton)
    .waitToClick(selectors.uploadsView.acceptPublishModel)
    .wait('.alert.alert-success')
    .exists('.alert.alert-success')
    .then((result) => {
      expect(result).toBe(true);
      done();
    });
  });

  it('should go to the library', () => {
    nightmare
    .waitForTheEntityToBeIndexed()
    .waitToClick(selectors.navigation.libraryNavButton);
  });

  describe('select multiple items', () => {
    describe('holding control', () => {
      it('should select individual items and display a list', (done) => {
        nightmare.click(selectors.libraryView.librarySecondDocument)
        .ctrlClick(selectors.libraryView.libraryThirdDocument)
        .ctrlClick(selectors.libraryView.libraryFirstDocument)
        .wait(selectors.libraryView.libraryMultiEditListHeader)
        .getInnerText(selectors.libraryView.libraryMultiEditListHeader)
        .then((text) => {
          expect(text.trim()).toBe('3 selected');
          done();
        })
        .catch(catchErrors(done));
      });
    });

    describe('using shift', () => {
      it('should select all items between the 2 selected items and display a list', (done) => {
        nightmare.click(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.libraryThirdDocument)
        .wait(selectors.libraryView.libraryMultiEditListHeader)
        .getInnerText(selectors.libraryView.libraryMultiEditListHeader)
        .then((text) => {
          expect(text.trim()).toBe('3 selected');
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('editing same types', () => {
    it('should render a form with comon properties and only update modified values', (done) => {
      nightmare.click(selectors.libraryView.librarySecondDocument)
      .ctrlClick(selectors.libraryView.libraryThirdDocument)
      .click(selectors.libraryView.libraryMultiEditEditButton)
      .wait(selectors.libraryView.libraryMultiEditFirstInput)
      .type(selectors.libraryView.libraryMultiEditFirstInput, 'Secret Service')
      .click(selectors.libraryView.libraryMultiEditSaveButton)
      .waitForTheEntityToBeIndexed()
      .click(selectors.libraryView.librarySecondDocument)
      .getInnerText(selectors.libraryView.libraryMetadataPanel)
      .then((text) => {
        expect(text.match('create chaos')).not.toBe(null);
        expect(text.match('Secret Service')).not.toBe(null);
        return nightmare.click(selectors.libraryView.libraryThirdDocument)
        .getInnerText(selectors.libraryView.libraryMetadataPanel);
      })
      .then((text) => {
        expect(text.match('create chaos')).not.toBe(null);
        expect(text.match('Secret Service')).not.toBe(null);
        done();
      })
      .catch(catchErrors(done));
    });
  });

  describe('deleting', () => {
    it('should delete multiple items at once after confirm', (done) => {
      nightmare.click(selectors.libraryView.libraryFirstDocument)
      .shiftClick(selectors.libraryView.libraryThirdDocument)
      .click(selectors.libraryView.libraryMultiEditDeleteButton)
      .wait(selectors.libraryView.deleteButtonConfirmation)
      .click(selectors.libraryView.deleteButtonConfirmation)
      .waitForTheEntityToBeIndexed()
      .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
      .then((text) => {
        expect(text).toBe('Man-bat');
        done();
      })
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
