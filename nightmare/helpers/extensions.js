import selectors from './selectors.js';
import config from './config.js';
import Nightmare from 'nightmare';

Nightmare.action('clearInput', function (selector, done) {
  let backSpaces = [];
  for (let i = 0; i < 50; i += 1) {
    backSpaces.push('\u0008');
  }
  this.wait(selector)
  .type(selector, backSpaces.join(''))
  .then(done);
});

Nightmare.action('typeEnter', function (selector, done) {
  this.type(selector, '\u000d')
  .then(done);
});

Nightmare.action('librarySearch', function (searchTerm, done) {
  this.write(selectors.libraryView.searchInput, 'batman')
  .type(selectors.libraryView.searchInput, '\u000d')
  .wait('.item-snippet')
  .then(done);
});

Nightmare.action('write', function (selector, text, done) {
  this.wait(selector)
  .insert(selector, text)
  .wait(5)
  .then(done)
  .catch((error) => {
    console.error(error);
  });
});

Nightmare.action('gotoLibrary', function (done) {
  this.goto(config.url)
  .waitToClick(selectors.navigation.libraryNavButton)
  .wait(selectors.libraryView.libraryFirstDocument)
  .then(done);
});

Nightmare.action('countFiltersResults', function (done) {
  this.evaluate_now(() => {
    return document.querySelectorAll('.item-entity').length;
  }, done);
});

Nightmare.action('goToUploads', function (done) {
  this.goto(config.url)
  .waitToClick(selectors.navigation.uploadsNavButton)
  .wait(selectors.libraryView.libraryFirstDocument)
  .then(done);
});

Nightmare.action('login', function (name, password, done) {
  this.goto(config.url)
  .wait(selectors.navigation.loginNavButton)
  .click(selectors.navigation.loginNavButton)
  .wait('#username')
  .write('input[name="username"]', name)
  .write('input[name="password"]', password)
  .click('button[type="submit"]')
  .wait(selectors.navigation.settingsNavButton)
  .then(done);
});

Nightmare.action('waitForTheEntityToBeIndexed', function (done) {
  this.wait(1200)
  .then(done);
});

Nightmare.action('waitToClick', function (selector, done) {
  this.wait(selector)
  .click(selector)
  .then(done);
});

Nightmare.action('ctrlClick', function (selector, done) {
  this.wait(selector)
  .evaluate((elementToClick) => {
    const e = new MouseEvent('click', {
      ctrlKey: true,
      view: window,
      bubbles: true,
      cancelable: true
    });
    document.querySelector(elementToClick).dispatchEvent(e);
  }, selector)
  .then(done);
});

Nightmare.action('shiftClick', function (selector, done) {
  this.wait(selector)
  .evaluate((elementToClick) => {
    const e = new MouseEvent('click', {
      shiftKey: true,
      view: window,
      bubbles: true,
      cancelable: true
    });
    document.querySelector(elementToClick).dispatchEvent(e);
  }, selector)
  .then(done);
});

Nightmare.action('isVisible', function (selector, done) {
  this.wait(selector)
  .evaluate_now((elementSelector) => {
    const selectorMatches = document.querySelectorAll(elementSelector);
    const element = selectorMatches[0];
    if (selectorMatches.length > 1) {
      throw new Error(`multiple matches of ${elementSelector} found`);
    }
    let isVisible = false;
    if (element) {
      const eventHandler = (e) => {
        e.preventDefault();
        isVisible = true;
      };
      element.addEventListener('mouseover', eventHandler);
      const elementBoundaries = element.getBoundingClientRect();
      const x = elementBoundaries.left + element.offsetWidth / 2;
      const y = elementBoundaries.top + element.offsetHeight / 2;
      const elementInCenter = document.elementFromPoint(x, y);
      const elementInTopLeft = document.elementFromPoint(elementBoundaries.left, elementBoundaries.top);
      const elementInBottomRight = document.elementFromPoint(elementBoundaries.right, elementBoundaries.bottom);
      const e = new MouseEvent('mouseover', {
        view: window,
        bubbles: true,
        cancelable: true
      });
      if (elementInCenter) {
        elementInCenter.dispatchEvent(e);
      }
      if (elementInTopLeft) {
        elementInTopLeft.dispatchEvent(e);
      }
      if (elementInBottomRight) {
        elementInBottomRight.dispatchEvent(e);
      }
      element.removeEventListener('mouseover', eventHandler);
    }
    return isVisible;
  }, done, selector);
});

Nightmare.action('waitForCardToBeCreated', function (cardTitle, done) {
  this.wait((title) => {
    let cards = document.querySelectorAll('.main-wrapper div.item-entity, .main-wrapper div.item-document');

    let found = false;

    cards.forEach((card) => {
      if (card.querySelector('.item-name span').innerText.toLowerCase().match(title.toLowerCase())) {
        found = true;
      }
    });

    return found;
  }, cardTitle)
  .then(done);
});

Nightmare.action('waitForCardStatus', function (selector, statusText, done) {
  this.wait((cardSelector, cardStatus) => {
    let cardLabel = document.querySelector(cardSelector + ' .label');

    if (cardLabel) {
      return cardLabel.innerText.match(cardStatus);
    }

    return false;
  }, selector, statusText)
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
  .wait('.settings form')
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

//this.write(selectors.libraryView.searchInput, itemName)
//.type(selectors.libraryView.searchInput, '\u000d')
//.wait(selectors.libraryView.anyItemSnippet)
Nightmare.action('clickCardOnLibrary', function (itemName, done) {
  this.evaluate((nameToFind) => {
    let cards = document.querySelectorAll('.main-wrapper div.item-entity,.main-wrapper div.item-document');
    let found = false;
    cards.forEach((card) => {
      if (found) {
        return;
      }
      if (card.innerText.match(nameToFind)) {
        found = card;
      }
    });

    if (found) {
      found.click();
    }
  }, itemName)
  .then(done);
});

Nightmare.action('getResultsAsJson', function (done) {
  this.evaluate_now(() => {
    let normalizedCards = [];
    let cards = document.querySelectorAll('.main-wrapper div.item-entity, .main-wrapper div.item-document');
    cards.forEach((card) => {
      let normalized = {};
      normalized.title = card.querySelector('.item-name span').innerText;
      if (card.querySelector('.item-connection span')) {
        normalized.connectionType = card.querySelector('.item-connection span').innerText;
      }
      normalizedCards.push(normalized);
    });
    return normalizedCards;
  }, done);
});

Nightmare.action('openEntityFromLibrary', function (itemName, done) {
  this.evaluate((nameToFind) => {
    let cards = document.querySelectorAll('.main-wrapper div.item-entity');
    let found = false;
    cards.forEach((card) => {
      if (found) {
        return;
      }
      if (card.innerText.match(nameToFind)) {
        found = card;
      }
    });

    if (found) {
      found.querySelector('a').click();
    }
  }, itemName)
  .wait(elementToSelect => {
    return document.querySelector(elementToSelect).innerText;
  }, selectors.entityView.contentHeaderTitle)
  .then(done);
});

Nightmare.action('openEntityFromLibrary', function (itemName, done) {
  this.evaluate((nameToFind) => {
    let cards = document.querySelectorAll('div.item-entity');
    let found = false;
    cards.forEach((card) => {
      if (found) {
        return;
      }
      if (card.querySelector('.item-name span').innerText.match(nameToFind)) {
        found = card;
      }
    });

    if (found) {
      found.querySelector('a').click();
    }
  }, itemName)
  .wait(elementToSelect => {
    return document.querySelector(elementToSelect).innerText;
  }, selectors.entityView.contentHeaderTitle)
  .then(done);
});

Nightmare.action('openDocumentFromLibrary', function (itemName, done) {
  this.evaluate((nameToFind) => {
    let cards = document.querySelectorAll('div.item-document');
    let found = false;
    cards.forEach((card) => {
      if (found) {
        return;
      }
      if (card.innerText.match(nameToFind)) {
        found = card;
      }
    });

    if (found) {
      found.querySelector('a.item-shortcut').click();
    }
  }, itemName)
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
