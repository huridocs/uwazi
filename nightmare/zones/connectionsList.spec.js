/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

selectors.doc = {
  form: {
    knownAccomplices: '#metadataForm > div:nth-child(4) > div:nth-child(3) > ul > li.wide > select'
  }
};

fdescribe('ConnectionsList zone', () => {
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
    .select(selectors.doc.form.knownAccomplices, '86raxe05i4uf2yb9')
    .then(done);
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
