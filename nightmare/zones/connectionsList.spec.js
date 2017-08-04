/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 300]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('ConnectionsList zone', () => {
  describe('metadata editing', () => {
    it('should log in as admin and go into the entity viewer for the desired entity', (done) => {
      const entityTitle = 'Man-bat';

      nightmare
      .login('admin', 'admin')
      .openEntityFromLibrary(entityTitle)
      .getInnerText(selectors.entityView.contentHeader)
      .then(headerText => {
        expect(headerText).toContain(entityTitle);
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
