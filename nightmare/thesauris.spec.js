import Nightmare from 'nightmare';
import * as thesauris from './helpers/thesauris.js';

describe('thesauris', () => {
  let nightmare;

  beforeEach(() => {
    nightmare = new Nightmare({show: true}).viewport(1100, 600);
  });

  let catchError = (done) => {
    return (error) => {
      expect(error).toBe(null);
      done();
    };
  };

  describe('add thesauri', () => {
    it('should add a new thesauri, add two values then delete it', (done) => {
      let thesauriName = 'Test sauri';
      nightmare = thesauris.addThesauri(nightmare, thesauriName);
      thesauris.addValuesToThesauri(nightmare, thesauriName);
      thesauris.deleteThesauri(nightmare, thesauriName)
      .wait(50)
      .end()
      .then(done)
      .catch(catchError(done));
    });
  });
});
