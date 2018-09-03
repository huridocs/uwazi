/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import { catchErrors } from 'api/utils/jasmineHelpers';
import selectors from '../helpers/selectors.js';
import createNightmare from '../helpers/nightmare';
import config from '../helpers/config.js';
import insertFixtures from '../helpers/insertFixtures';

const nightmare = createNightmare();

describe('Library zone', () => {
  beforeAll(async () => insertFixtures());
  afterAll(async () => nightmare.end());

  it('should go to library', (done) => {
    nightmare
    // wait for documents to index
    .wait(2000)
    .goto(config.url)
    .then(() => { done(); })
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
});
