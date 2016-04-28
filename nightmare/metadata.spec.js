import Nightmare from 'nightmare';
import {addThesauri, addThesauriName, checkThesauriName} from './helpers/metadata.js'
import url from './helpers/url.js';

var getInnerText = (selector) => {
  return document.querySelector(selector).innerText;
}

describe('metadata', () => {
  let nightmare;

  beforeEach(() => {
    nightmare = new Nightmare({show: true}).viewport(1100, 600);
  })

  var getInnerText = (selector) => {
    return document.querySelector(selector).innerText;
  }

  var catchError = (done) => {
    return (error) => {
      expect(error).toBe(null);
      done();
    }
  }

  describe('add thesauri', () => {
    it('should add a new thesauri', (done) => {
      addThesauri(nightmare, 'Test sauri')
      .goto(url + '/metadata')
      .evaluate(getInnerText, '.thesauris li a')
      .end()
      .then((innerText) => {
        expect(innerText).toBe('Test sauri');
        done();
      })
    });
  });
});
