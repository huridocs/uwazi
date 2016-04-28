import url from './url.js';

export function login(nightmare){
  return nightmare
        .goto(url + '/login')
        .type('input[name="username"]', 'admin')
        .type('input[name="password"]', 'admin')
        .click('button[type="submit"]')
        .wait(100)
}

export function invalidLogin(nightmare){
  return nightmare
        .goto(url + '/login')
        .type('input[name="username"]', 'wrong')
        .type('input[name="password"]', 'pass')
        .click('button[type="submit"]')
        .wait(100)
}
