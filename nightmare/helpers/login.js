import config from './config.js';

export function login(nightmare, userName, userPassword) {
  return nightmare
        .goto(config.url + '/login')
        .type('input[name="username"]', userName)
        .type('input[name="password"]', userPassword)
        .click('button[type="submit"]')
        .wait(config.waitTime);
}
