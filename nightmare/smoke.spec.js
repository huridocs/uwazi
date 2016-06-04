import Nightmare from 'nightmare';
import {login, invalidLogin} from './helpers/login.js'
import url from './helpers/url.js';


fdescribe('Smoke test', () => {
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

  describe('navigation buttons', () => {
    it('should check if user/admin nav button works', (done) => {
      login(nightmare, url)
      .goto(url)
      .click('.fa-user')
      .wait(50)
      .url()
      .end()
      .then((url) => {
        console.log('user ✓');
        expect(url).toBe('http://localhost:3000/my_account');
        done();
      })
    });

    it('should check if uploads nav button works', (done) => {
      login(nightmare, url)
      .goto(url)
      .click('a[href="/uploads"]')
      .wait(50)
      .url()
      .end()
      .then((url) => {
        console.log('uploads ✓');
        expect(url).toBe('http://localhost:3000/uploads');
        done();
      })
    });

    it('should check if library nav button works', (done) => {
      login(nightmare, url)
      .goto(url + '/metadata')
      .wait(50)
      .click('a[href="/"]')
      .wait(50)
      .url()
      .end()
      .then((url) => {
        console.log('library ✓');
        expect(url).toBe('http://localhost:3000/');
        done();
      })
    });

    it('should check if metadata nav button works', (done) => {
      login(nightmare, url)
      .goto(url)
      .click('a[href="/metadata"]')
      .wait(50)
      .url()
      .end()
      .then((url) => {
        console.log('metadata ✓');
        expect(url).toBe('http://localhost:3000/metadata');
        done();
      })
    });
  });

  describe('metadata view', () => {
    describe('document type section', () => {
      it('should check document type section presence', (done) => {
        login(nightmare, url)
        .wait(50)
        .click('a[href="/metadata"]')
        .wait(50)
        .evaluate(getInnerText, '.document .panel-heading')
        .end()
        .then(function(innerText){
          console.log('Document type presence ✓');
          expect(innerText).toBe('Document type')
        })
        .then(done)
      })
    });
  });
});
