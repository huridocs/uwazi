import Nightmare from 'nightmare';
import {login, invalidLogin} from './helpers/login.js'
import url from './helpers/url.js';

describe('login', () => {
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

  describe('login success', () => {
    it('should redirect to home page', (done) => {
      login(nightmare, url)
      .url()
      .end()
      .then((url) => {
        expect(url).toBe('http://localhost:3000/');
        done();
      })
    });
  });

  describe('form errors', () => {
    it('should show error message', (done) => {
      invalidLogin(nightmare, url)
      .evaluate(getInnerText, '.alert-message')
      .end()
      .then((innerText) => {
        expect(innerText).toBe('Invalid password or username');
        done();
      })
      .catch(catchError(done));
    });
  });
});
