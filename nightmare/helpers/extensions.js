import config from './config.js';
import Nightmare from 'nightmare';

const loginNavButton = '#app > div.content > header > div > div > ul > li:nth-child(2) > a';
const settingsNavButton = '#app > div.content > header > div > div > ul > li:nth-child(3)';

Nightmare.action('login', function (name, password, done) {
  this.goto(config.url)
  .wait(loginNavButton)
  .click(loginNavButton)
  .wait('#username')
  .type('input[name="username"]', name)
  .type('input[name="password"]', password)
  .click('button[type="submit"]')
  .wait(settingsNavButton)
  .then(done);
});
