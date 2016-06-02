import Nightmare from 'nightmare';
import * as thesauris from './helpers/thesauris.js'
import url from './helpers/url.js';

var getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
}

describe('thesauris', () => {
  let nightmare;

  beforeEach(() => {
      nightmare = new Nightmare({show: true}).viewport(1100, 600);
  })

  var catchError = (done) => {
    return (error) => {
      expect(error).toBe(null);
      done();
    }
  }

  describe('add thesauri', () => {
    it('should add a new thesauri, add tow values then delete it', (done) => {
      var thesauri_name = 'Test sauri'
      nightmare = thesauris.addThesauri(nightmare, thesauri_name);
      thesauris.addValuesToThesauri(nightmare, thesauri_name)
      thesauris.deleteThesauri(nightmare, thesauri_name)
      .wait(50)
      .end()
      .then(done)
      .catch(catchError(done));
    });
  });
});
