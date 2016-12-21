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

Nightmare.action('manageItemFromList', function (targetText, action, done) {
  this.wait((listSelector, textToMatch) => {
    let itemFound = false;
    let list = document.querySelectorAll(listSelector);
    list.forEach((item) => {
      if (item.innerText.match(textToMatch)) {
        itemFound = true;
      }
    });
    return itemFound;
  }, selectors.settingsView.liElementsOfSection, targetText)
  .evaluate((listSelector, textToMatch, actionToTake) => {
    let list = document.querySelectorAll(listSelector);
    list.forEach((item) => {
      if (item.innerText.match(textToMatch)) {
        item.querySelector(actionToTake).click();
      }
    });
  }, selectors.settingsView.liElementsOfSection, targetText, action)
  .then(done);
});

Nightmare.action('deleteItemFromList', function (targetText, done) {
  this.manageItemFromList(targetText, '.fa-trash')
  .then(done);
});

Nightmare.action('editItemFromList', function (targetText, done) {
  this.manageItemFromList(targetText, '.fa-pencil')
  .wait('.admin-content form')
  .then(done);
});
