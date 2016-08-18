import config from './config.js';

const loginNavButton = '#app > div.content > header > div > div > ul > li:nth-child(2) > a';
// const searchButton = '#app > div.content > header > div > div > div > a';

export function login(nightmare, userName, userPassword) {
  return nightmare
        .goto(config.url)
        .wait(loginNavButton)
        .realClick(loginNavButton)
        .wait('#username')
        .type('input[name="username"]', userName)
        .type('input[name="password"]', userPassword)
        .click('button[type="submit"]');
}
