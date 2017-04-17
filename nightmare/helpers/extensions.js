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

Nightmare.action('waitForTheEntityToBeIndexed', function (done) {
  this.wait(1000)
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

Nightmare.action('getInnerText', function (selector, done) {
  this.wait(selector)
  .evaluate_now((elementToSelect) => {
    return document.querySelector(elementToSelect).innerText;
  }, done, selector);
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

Nightmare.action('openEntityFromLibrary', function (itemName, done) {
  this.type(selectors.libraryView.searchInput, itemName)
  .waitToClick(selectors.libraryView.firstSearchSuggestion)
  .wait(elementToSelect => {
    return document.querySelector(elementToSelect).innerText;
  }, selectors.entityView.contentHeaderTitle)
  .then(done);
});

Nightmare.action('openDocumentFromLibrary', function (itemName, done) {
  this.type(selectors.libraryView.searchInput, itemName)
  .waitToClick(selectors.libraryView.firstSearchSuggestion)
  .wait(elementToSelect => {
    return document.querySelector(elementToSelect).innerText;
  }, selectors.documentView.contentHeader)
  .then(done);
});

Nightmare.action('editEntityFromEntityViewer', function (done) {
  this.waitToClick(selectors.entityView.editButton)
  .wait(selectors.entityView.metadataForm)
  .then(done);
});

Nightmare.action('editDocumentFromDocumentViewer', function (done) {
  this.waitToClick(selectors.documentView.editButton)
  .wait(selectors.documentView.metadataForm)
  .then(done);
});

Nightmare.action('saveEntityFromEntityViewer', function (done) {
  this.waitToClick(selectors.entityView.saveButton)
  .wait(selectors.entityView.editButton)
  .then(done);
});

Nightmare.action('saveFromDocumentViewer', function (done) {
  this.waitToClick(selectors.documentView.saveButton)
  .wait(selectors.documentView.editButton)
  .then(done);
});

Nightmare.action('openSidePanelOnDocumentViewer', function (done) {
  this.waitToClick(selectors.documentView.openSidePanelButton)
  .wait(selectors.documentView.sidePanelTitle)
  .then(done);
});

Nightmare.action('pickToday', function (input, done) {
  this.waitToClick(input)
  .wait(selectors.datePicker.today)
  .click(selectors.datePicker.today)
  .wait(elementToSelect => {
    return document.querySelector(elementToSelect).value;
  }, input)
  .then(done);
});
