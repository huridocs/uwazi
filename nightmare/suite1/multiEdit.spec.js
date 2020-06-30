/*eslint max-nested-callbacks: ["error", 10]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import config from '../helpers/config.js';
import createNightmare from '../helpers/nightmare';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('multi edit path', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  describe('creating entities for the test', () => {
    describe('login', () => {
      it('it should create 3 entities', done => {
        nightmare
          .login('admin', 'admin')
          .waitToClick(selectors.navigation.uploadsNavButton)
          .wait(selectors.uploadsView.newEntityButtom)
          .url()
          .then(url => {
            expect(url.match(`${config.url}/uploads`)).not.toBe(null);
            done();
          })
          .catch(catchErrors(done));
      });
    });

    it('should create 3 new entities and publish them', done => {
      nightmare
        .waitToClick(selectors.uploadsView.newEntityButtom)
        .write(selectors.newEntity.form.title, 'King Ping')
        .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
        .waitToClick(selectors.uploadsView.saveButton)
        .waitToClick('.alert.alert-success')
        .waitToClick(selectors.uploadsView.newEntityButtom)
        .write(selectors.newEntity.form.title, 'Mysterio')
        .select(selectors.newEntity.form.type, '58f0aed2e147e720856a0741')
        .waitToClick(selectors.uploadsView.saveButton)
        .waitToClick('.alert.alert-success')
        .waitToClick(selectors.uploadsView.newEntityButtom)
        .write(selectors.newEntity.form.title, 'Dormmamu')
        .select(selectors.newEntity.form.type, '58ad7d240d44252fee4e61fb')
        .waitToClick(selectors.uploadsView.saveButton)
        .wait('.alert.alert-success')
        .isVisible('.alert.alert-success')
        .then(result => {
          expect(result).toBe(true);
          done();
        });
    });
  });

  describe('editing different types', () => {
    it('should render a form with common properties', done => {
      nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.libraryThirdDocument)
        .waitToClick(selectors.libraryView.libraryMultiEditEditButton)
        .wait(selectors.libraryView.libraryMultiEditFormOption)
        .waitToClick(selectors.libraryView.libraryMultiEditFormOption)
        .waitToClick(selectors.libraryView.libraryMultiEditSaveButton)
        .waitToClick('.alert.alert-success')
        .waitForTheEntityToBeIndexed()
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .getInnerText(selectors.libraryView.libraryMetadataPanel)
        .then(text => {
          expect(text.match('hyper speed kick')).not.toBe(null);
          return nightmare
            .waitToClick(selectors.libraryView.librarySecondDocument)
            .getInnerText(selectors.libraryView.libraryMetadataPanel);
        })
        .then(text => {
          expect(text.match('hyper speed kick')).not.toBe(null);
          return nightmare
            .waitToClick(selectors.libraryView.libraryThirdDocument)
            .wait(selectors.libraryView.libraryMetadataPanel)
            .getInnerText(selectors.libraryView.libraryMetadataPanel);
        })
        .then(text => {
          expect(text.match('hyper speed kick')).not.toBe(null);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  it('should publish the entities', done => {
    nightmare
      .waitToClick(selectors.libraryView.libraryFirstDocument)
      .shiftClick(selectors.libraryView.libraryThirdDocument)
      .waitToClick(selectors.uploadsView.multiPublishButton)
      .waitToClick(selectors.uploadsView.acceptPublishModel)
      .waitToClick('.alert.alert-success')
      .waitToDisapear('.alert.alert-success')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
  });

  it('should go to the library', () => {
    nightmare.waitForTheEntityToBeIndexed().waitToClick(selectors.navigation.libraryNavButton);
  });

  describe('select multiple items', () => {
    describe('holding control', () => {
      it('should select individual items and display a list', done => {
        nightmare
          .waitToClick(selectors.libraryView.librarySecondDocument)
          .ctrlClick(selectors.libraryView.libraryThirdDocument)
          .ctrlClick(selectors.libraryView.libraryFirstDocument)
          .wait(selectors.libraryView.libraryMultiEditListHeader)
          .getInnerText(selectors.libraryView.libraryMultiEditListHeader)
          .then(text => {
            expect(text.trim()).toBe('3 selected');
            done();
          })
          .catch(catchErrors(done));
      });
    });

    describe('using shift', () => {
      it('should select all items between the 2 selected items and display a list', done => {
        nightmare
          .waitToClick(selectors.libraryView.libraryFirstDocument)
          .shiftClick(selectors.libraryView.libraryThirdDocument)
          .wait(selectors.libraryView.libraryMultiEditListHeader)
          .getInnerText(selectors.libraryView.libraryMultiEditListHeader)
          .then(text => {
            expect(text.trim()).toBe('3 selected');
            done();
          })
          .catch(catchErrors(done));
      });
    });
  });

  describe('editing same types', () => {
    it('should render a form with common properties and only update modified values', done => {
      nightmare
        .waitToClick(selectors.libraryView.librarySecondDocument)
        .ctrlClick(selectors.libraryView.libraryThirdDocument)
        .waitToClick(selectors.libraryView.libraryMultiEditEditButton)
        .wait(selectors.libraryView.libraryMultiEditFirstInput)
        .write(selectors.libraryView.libraryMultiEditFirstInput, 'Secret Service')
        .waitToClick(selectors.libraryView.libraryMultiEditSaveButton)
        .waitForTheEntityToBeIndexed()
        .waitToClick(selectors.libraryView.librarySecondDocument)
        .getInnerText(selectors.libraryView.libraryMetadataPanel)
        .then(text => {
          expect(text.match('hyper speed kick')).not.toBe(null);
          expect(text.match('Secret Service')).not.toBe(null);
          return nightmare
            .waitToClick(selectors.libraryView.libraryThirdDocument)
            .getInnerText(selectors.libraryView.libraryMetadataPanel);
        })
        .then(text => {
          expect(text.match('hyper speed kick')).not.toBe(null);
          expect(text.match('Secret Service')).not.toBe(null);
          done();
        })
        .catch(catchErrors(done));
    });
  });

  describe('deleting', () => {
    it('should delete multiple items at once after confirm', done => {
      nightmare
        .waitToClick(selectors.libraryView.libraryFirstDocument)
        .shiftClick(selectors.libraryView.libraryThirdDocument)
        .waitToClick(selectors.libraryView.libraryMultiEditDeleteButton)
        .wait(selectors.libraryView.deleteButtonConfirmation)
        .waitToClick(selectors.libraryView.deleteButtonConfirmation)
        .waitForTheEntityToBeIndexed()
        .getInnerText(selectors.libraryView.libraryFirstDocumentTitle)
        .then(text => {
          expect(text).toBe('Man-bat');
          done();
        })
        .catch(catchErrors(done));
    });
  });
});
