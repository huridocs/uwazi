import Nightmare from 'nightmare';

describe('login', () => {

  let url = 'http://localhost:3000';
  let nightmare;

  beforeEach(() => {
    nightmare = new Nightmare({show: true}).viewport(1100, 600);
  })

  var getInnerText = (selector) => {
    return document.querySelector(selector).innerText;
  }

  describe('login success', () => {
    it('should redirect to home page', (done) => {
      nightmare.goto(url + '/login')
      .type('input[name="username"]', 'admin')
      .type('input[name="password"]', 'admin')
      .click('button[type="submit"]')
      .wait('.fa-user')
      .end()
      .then(done);
    });
  });

  describe('form errors', () => {
    it('should show error message', (done) => {
      nightmare.goto(url + '/login')
      .type('input[name="username"]', 'wrong')
      .type('input[name="password"]', 'pass')
      .click('button[type="submit"]')
      .wait('.alert-message')
      .evaluate(getInnerText, '.alert-message')
      .end()
      .then((innerText) => {
        expect(innerText).toBe('Invalid password or username');
        done();
      }).catch((error) => {
        expect(error).toBe(null);
        done();
      });
    });
  });
});
