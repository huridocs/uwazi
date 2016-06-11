import Nightmare from 'nightmare';
import {login} from './helpers/login.js';

describe('login', () => {
  let nightmare;

  let getInnerText = (selector) => {
    return document.querySelector(selector).innerText;
  };

  let catchError = (done) => {
    return (error) => {
      expect(error).toBe(null);
      done();
    };
  };

  beforeEach(() => {
    nightmare = new Nightmare({show: true}).viewport(1100, 600);
  });

  describe('login success', () => {
    it('should redirect to home page', (done) => {
      login(nightmare, 'admin', 'admin')
      .url()
      .end()
      .then((url) => {
        expect(url).toBe('http://localhost:3000/');
        done();
      });
    });
  });

  describe('form errors', () => {
    it('should show error message', (done) => {
      login(nightmare, 'wrong', 'wrong')
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
