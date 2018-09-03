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
    .goto(config.url)
    .then(() => { done(); })
    .catch(catchErrors(done));
  });

  describe('Load more documents', () => {
    it('should Load more', (done) => {
      nightmare
      .wait(400)
      .waitToClick(selectors.libraryView.loadMore)
      .wait(selectors.libraryView.documentAfterLoadMore, 1000)
      .wait(200)
      .exists(selectors.libraryView.documentAfterLoadMore)
      .then((exists) => {
        expect(exists).toBe(true);
        done();
      })
      .catch(catchErrors(done));
    });
  });
});
