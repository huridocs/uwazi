import config from './config.js';

export function login(nightmare, userName, userPassword) {
  return nightmare
        .goto(config.url + '/login')
        .insert('input[name="username"]', userName)
        .insert('input[name="password"]', userPassword)
        .click('button[type="submit"]')
        .wait(100);
}
