import config from './config.js';

export function login(nightmare) {
  return nightmare
        .goto(config.url + '/login')
        .insert('input[name="username"]', 'admin')
        .insert('input[name="password"]', 'admin')
        .click('button[type="submit"]')
        .wait(100);
}

export function invalidLogin(nightmare) {
  return nightmare
        .goto(config.url + '/login')
        .insert('input[name="username"]', 'wrong')
        .insert('input[name="password"]', 'pass')
        .click('button[type="submit"]')
        .wait(100);
}
