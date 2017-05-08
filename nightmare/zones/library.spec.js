/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';

const nightmare = createNightmare();

describe('Library zone', () => {
  it('should go to library', (done) => {
    nightmare
    .goto(config.url)
    .then(done)
    .catch(catchErrors(done));
  });

  describe('Load more documents', () => {
    it('should Load more', (done) => {
      nightmare
      .waitToClick(selectors.libraryView.loadMore)
      .wait(selectors.libraryView.documentAfterLoadMore)
      .exists(selectors.libraryView.documentAfterLoadMore)
      .then((exists) => {
        expect(exists).toBe(true);
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
