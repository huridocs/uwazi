import createNightmare from '../helpers/nightmare';
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';

const nightmare = createNightmare();

describe('Connections', () => {
  describe('login', () => {
    it('should log in as admin', (done) => {
      nightmare
      .login('admin', 'admin')
      .then(() => {
        done();
      })
      .catch(catchErrors(done));
    }, 10000);
  });

  it('should find "Batman begins" story and open it', (done) => {
    nightmare
    .librarySearch('Batman begins')
    .waitFirstDocumentToMatch('Batman begins')
    .waitToClick(selectors.libraryView.libraryFirstDocumentLink)
    .waitToClick(selectors.entityView.connectionsListView)
    .wait(1000)
    .then(done)
    .catch(catchErrors(done));
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
