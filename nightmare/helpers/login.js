import config from './config.js';

const searchButton = '#app > div.content > header > div > div > div > a';

export function login(nightmare, userName, userPassword) {
  return nightmare
        .goto(config.url + '/login')
        .wait('#username')
        .type('input[name="username"]', userName)
        .type('input[name="password"]', userPassword)
        .click('button[type="submit"]')
        .wait(searchButton);
}
