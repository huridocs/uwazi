import selectors from './selectors.js';
import config from './config.js';
import Nightmare from 'nightmare';

Nightmare.action('clearInput', function (selector, done) {
  let backSpaces = [];
  for (let i = 0; i < 20; i += 1) {
    backSpaces.push('\u0008');
  }
  this.wait(selector)
  .type(selector, backSpaces.join(''))
  .then(done);
});

Nightmare.action('login', function (name, password, done) {
  this.goto(config.url)
  //.waitToClick('#app > div.content > header > ul > li.menuActions > ul.menuNav-I18NMenu > li:nth-child(2) > a')
  .wait(selectors.navigation.loginNavButton)
  .click(selectors.navigation.loginNavButton)
  .wait('#username')
  .type('input[name="username"]', name)
  .type('input[name="password"]', password)
  .click('button[type="submit"]')
  .wait(selectors.navigation.settingsNavButton)
  .then(done);
});

Nightmare.action('waitToClick', function (selector, done) {
  this.wait(selector)
  .click(selector)
  .then(done);
});

Nightmare.action('manageItemFromList', function (liElement, targetText, action, done) {
  this.wait((listSelector, textToMatch) => {
    let itemFound = false;
    let list = document.querySelectorAll(listSelector);
    list.forEach((item) => {
      let text = item.innerText;
      text += Array.from(item.querySelectorAll('input')).map(input => input.value).join('');
      if (text.match(textToMatch)) {
        itemFound = true;
      }
    });
    return itemFound;
  }, liElement, targetText)
  .evaluate((listSelector, textToMatch, actionToTake) => {
    let list = document.querySelectorAll(listSelector);
    list.forEach((item) => {
      let text = item.innerText;
      text += Array.from(item.querySelectorAll('input')).map(input => input.value).join('');
      if (text.match(textToMatch)) {
        item.querySelector(actionToTake).click();
      }
    });
  }, liElement, targetText, action)
  .then(done);
});

Nightmare.action('deleteItemFromList', function (liElement, targetText, done) {
  this.manageItemFromList(liElement, targetText, '.btn-danger')
  .then(done);
});

Nightmare.action('editItemFromList', function (liElement, targetText, done) {
  this.manageItemFromList(liElement, targetText, '.fa-pencil')
  .wait('.admin-content form')
  .then(done);
});

Nightmare.action('scrollElement', function (selector, height, done) {
  this.wait(selector)
  .evaluate((elementToScroll, scrollHeight) => {
    document.querySelector(elementToScroll).scrollTop = scrollHeight;
  }, selector, height)
  .then(done);
});

Nightmare.action('selectText', function (selector, done) {
  this.wait(selector)
  .evaluate((elementToSelect) => {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector(elementToSelect));
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }, selector)
  .mouseup(selector)
  .then(done);
});
