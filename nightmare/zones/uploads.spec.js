/*eslint max-nested-callbacks: ["error", 10], max-len: ["error", 500]*/
import selectors from '../helpers/selectors.js';
import {catchErrors} from 'api/utils/jasmineHelpers';
import createNightmare from '../helpers/nightmare';

const nightmare = createNightmare();

describe('Uploads', () => {
  it('should log in as admin', (done) => {
    nightmare
    .login('admin', 'admin')
    .goToUploads()
    .then(() => {
      done();
    })
    .catch(catchErrors(done));
  }, 10000);

  describe('when uploading a pdf', () => {
    it('should create the new document and show a "no type state"', (done) => {
      let expectedTitle = 'Valid';

      nightmare
      .upload('.upload-box input', __dirname + '/test_files/valid.pdf')
      .waitForCardToBeCreated(expectedTitle)
      .waitForCardStatus(selectors.uploadsView.firstDocument, 'No type selected')
      .getResultsAsJson()
      .then((results) => {
        expect(results[0].title).toBe(expectedTitle);
        done();
      })
      .catch(catchErrors(done));
    });

    describe('when processing fails', () => {
      it('should create the document and show "Conversion failed"', (done) => {
        let expectedTitle = 'Invalid';

        nightmare
        .upload('.upload-box input', __dirname + '/test_files/invalid.pdf')
        .waitForCardToBeCreated(expectedTitle)
        .waitForCardStatus(selectors.uploadsView.firstDocument, 'Conversion failed')
        .getResultsAsJson()
        .then((results) => {
          expect(results[0].title).toBe(expectedTitle);
          done();
        })
        .catch(catchErrors(done));
      });
    });
  });

  describe('closing browser', () => {
    it('should close the browser', (done) => {
      nightmare.end()
      .then(done);
    });
  });
});
