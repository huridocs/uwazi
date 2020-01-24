/**
 * /* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}]
 *
 * @format
 */

import Nightmare from 'nightmare';
import selectors from './selectors.js';
import config from './config.js';

Nightmare.action('clearInput', function clearInput(selector, done) {
  const backSpaces = [];
  for (let i = 0; i < 50; i += 1) {
    backSpaces.push('\u0008');
  }
  this.wait(selector)
    .type(selector, backSpaces.join(''))
    .then(() => {
      done();
    });
});

Nightmare.action('typeEnter', function typeEnter(selector, done) {
  this.type(selector, '\u000d').then(() => {
    done();
  });
});

Nightmare.action('waitFirstDocumentToMatch', function waitFirstDocumentToMatch(term, done) {
  this.wait(
    (termToMatch, selector) => {
      const element = document.querySelector(selector);
      if (!element) {
        throw new Error(`Selector not Found! -> ${selector}`);
      }
      return element.innerText.match(termToMatch);
    },
    term,
    selectors.libraryView.libraryFirstDocument
  )
    .then(() => {
      done();
    })
    .catch(done);
});

Nightmare.action('waitToDisapear', function waitToDisappear(selector, done) {
  this.wait(_selector => !document.querySelector(_selector), selector)
    .then(() => {
      done();
    })
    .catch(done);
});

Nightmare.action('librarySearch', function librarySearch(searchTerm, done) {
  this.write(selectors.libraryView.searchInput, searchTerm)
    .type(selectors.libraryView.searchInput, '\u000d')
    .wait('.item-snippet')
    .then(() => {
      done();
    });
});

Nightmare.action('write', function write(selector, text, done) {
  this.wait(selector)
    // to prevet fails from multiple renders :(
    .wait(300)
    // to prevet fails from multiple renders :(
    .insert(selector, text)
    .then(() => {
      done();
    });
});

Nightmare.action('gotoLibrary', function gotoLibrary(done) {
  this.goto(config.url)
    .waitToClick(selectors.navigation.libraryNavButton)
    .wait(selectors.libraryView.libraryFirstDocument)
    .then(() => {
      done();
    });
});

Nightmare.action('countFiltersResults', function countFiltersResults(done) {
  this.evaluate_now(() => document.querySelectorAll('.item-document').length, done);
});

Nightmare.action('goToUploads', function goToUploads(done) {
  this.goto(config.url)
    .waitToClick(selectors.navigation.uploadsNavButton)
    .wait(selectors.libraryView.libraryFirstDocument)
    .then(() => {
      done();
    });
});

Nightmare.action('login', function login(name, password, done) {
  this.goto(config.url)
    .wait(selectors.navigation.loginNavButton)
    .click(selectors.navigation.loginNavButton)
    .wait('#username')
    .write('input[name="username"]', name)
    .write('input[name="password"]', password)
    .click('button[type="submit"]')
    .wait(selectors.navigation.settingsNavButton)
    .then(() => {
      done();
    });
});

Nightmare.action('loginAsAdminToSettings', function loginAsAdminToSettings(done) {
  this.login('admin', 'admin')
    .waitToClick(selectors.navigation.settingsNavButton)
    .wait(selectors.settingsView.settingsHeader)
    .url()
    .then(url => {
      expect(url).toBe(`${config.url}/settings/account`);
      done();
    });
});

Nightmare.action('logout', function logout(done) {
  this.waitToClick(selectors.navigation.settingsNavButton)
    .wait(selectors.settingsView.settingsHeader)
    .url()
    .then(() => this.waitToClick(selectors.settingsView.logoutButton))
    .then(done)
    .then(() => done());
});

Nightmare.action('waitForTheEntityToBeIndexed', function waitForTheEntityToBeIndexed(done) {
  this.wait(3000).then(() => {
    done();
  });
});

Nightmare.action('waitToClick', function waitToClicked(selector, done) {
  this.wait(selector, 1000)
    .wait(300)
    .wait(selector, 1000)
    .click(selector)
    .then(() => {
      done();
    })
    .catch(done);
});

Nightmare.action('ctrlClick', function ctrlClick(selector, done) {
  this.wait(selector)
    .evaluate(elementToClick => {
      const e = new MouseEvent('click', {
        ctrlKey: true,
        view: window,
        bubbles: true,
        cancelable: true,
      });
      document.querySelector(elementToClick).dispatchEvent(e);
    }, selector)
    .then(() => {
      done();
    });
});

Nightmare.action('shiftClick', function shiftClick(selector, done) {
  this.wait(selector)
    .evaluate(elementToClick => {
      const e = new MouseEvent('click', {
        shiftKey: true,
        view: window,
        bubbles: true,
        cancelable: true,
      });
      document.querySelector(elementToClick).dispatchEvent(e);
    }, selector)
    .then(() => {
      done();
    });
});

Nightmare.action('isVisible', function checkIsVisible(selector, done) {
  this.wait(selector).evaluate_now(
    elementSelector => {
      const selectorMatches = document.querySelectorAll(elementSelector);
      const element = selectorMatches[0];
      if (selectorMatches.length > 1) {
        throw new Error(`multiple matches of ${elementSelector} found`);
      }
      let isVisible = false;
      if (element) {
        const eventHandler = e => {
          e.preventDefault();
          isVisible = true;
        };
        // otherwise the mouseover test isn't possible:
        const origPointerEvents = element.style.pointerEvents;
        element.style.pointerEvents = 'all';

        element.addEventListener('mouseover', eventHandler);
        const elementBoundaries = element.getBoundingClientRect();
        const x = elementBoundaries.left + element.offsetWidth / 2;
        const y = elementBoundaries.top + element.offsetHeight / 2;
        const elementInCenter = document.elementFromPoint(x, y);
        const elementInTopLeft = document.elementFromPoint(
          elementBoundaries.left,
          elementBoundaries.top
        );
        const elementInBottomRight = document.elementFromPoint(
          elementBoundaries.right,
          elementBoundaries.bottom
        );
        const e = new MouseEvent('mouseover', {
          view: window,
          bubbles: true,
          cancelable: true,
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
        element.style.pointerEvents = origPointerEvents;
      }
      return isVisible;
    },
    done,
    selector
  );
});

Nightmare.action('waitForCardToBeCreated', function waitForCardToBeCreated(cardTitle, done) {
  this.wait(title => {
    const cards = document.querySelectorAll(
      '.main-wrapper div.item-document, .main-wrapper div.item'
    );

    let found = false;

    cards.forEach(card => {
      if (
        card
          .querySelector('.item-name span')
          .innerText.toLowerCase()
          .match(title.toLowerCase())
      ) {
        found = true;
      }
    });

    return found;
  }, cardTitle).then(() => {
    done();
  });
});

Nightmare.action('waitForCardStatus', function waitForCardStatus(selector, statusText, done) {
  this.wait(
    (cardSelector, cardStatus) => {
      const cardLabel = document.querySelector(`${cardSelector} .label`);
      if (cardLabel) {
        return cardLabel.innerText.match(cardStatus);
      }

      return false;
    },
    selector,
    statusText
  ).then(() => {
    done();
  });
});

Nightmare.action('waitForCardTemplate', function waitForCardTemplate(selector, templateText, done) {
  this.wait(
    (cardSelector, cardTemplate) => {
      const cardTemplateLabel = document.querySelector(`${cardSelector} .item-actions .btn-color`);
      if (cardTemplateLabel) {
        return cardTemplateLabel.innerText.match(cardTemplate);
      }

      return false;
    },
    selector,
    templateText
  ).then(() => {
    done();
  });
});

Nightmare.action('manageItemFromList', function manageItemFromList(
  liElement,
  targetText,
  action,
  done
) {
  this.wait(
    (listSelector, textToMatch) => {
      let itemFound = false;
      const list = document.querySelectorAll(listSelector);
      list.forEach(item => {
        let text = item.innerText;
        text += Array.from(item.querySelectorAll('input'))
          .map(input => input.value)
          .join('');
        if (text.match(textToMatch)) {
          itemFound = true;
        }
      });
      return itemFound;
    },
    liElement,
    targetText
  )
    .evaluate(
      (listSelector, textToMatch, actionToTake) => {
        const list = document.querySelectorAll(listSelector);
        list.forEach(item => {
          let text = item.innerText;
          text += Array.from(item.querySelectorAll('input'))
            .map(input => input.value)
            .join('');
          if (text.match(textToMatch)) {
            item.querySelector(actionToTake).click();
          }
        });
      },
      liElement,
      targetText,
      action
    )
    .then(() => {
      done();
    });
});

Nightmare.action('deleteItemFromList', function deleteItemFromList(liElement, targetText, done) {
  this.manageItemFromList(liElement, targetText, '.btn-danger').then(() => {
    done();
  });
});

Nightmare.action('editItemFromList', function editItemFromList(liElement, targetText, done) {
  this.manageItemFromList(liElement, targetText, '.btn-default')
    .wait('.settings form')
    .then(() => {
      done();
    });
});

Nightmare.action('selectDate', function selectDate(dateField, date, done) {
  this.wait(dateField)
    .insert(dateField, date)
    .wait(50)
    .waitToClick('.react-datepicker__day--selected')
    .then(done);
});

Nightmare.action('selectByLabel', function selectByLabel(elementSelector, targetText, done) {
  this.waitToClick(elementSelector)
    .evaluate(
      (selector, text) => {
        const select = document.querySelector(selector);
        const options = Array.from(select.querySelectorAll('option'));

        return options.find(option => option.innerText === text).value;
      },
      elementSelector,
      targetText
    )
    .then(value => this.select(elementSelector, value).then(done));
});

Nightmare.action('clickMultiselectOption', function clickMultiselectOption(
  liElement,
  targetText,
  done
) {
  this.manageItemFromList(liElement, targetText, '.multiselectItem-label').then(() => {
    done();
  });
});

Nightmare.action('scrollElement', function scrollElement(selector, height, done) {
  this.wait(selector)
    .evaluate(
      (elementToScroll, scrollHeight) => {
        document.querySelector(elementToScroll).scrollTop = scrollHeight;
      },
      selector,
      height
    )
    .then(() => {
      done();
    });
});

Nightmare.action('waitForText', function waitForText(selector, done) {
  this.wait(
    elementToSelect =>
      document.querySelector(elementToSelect) && document.querySelector(elementToSelect).innerText,
    selector
  ).then(() => {
    done();
  });
});

Nightmare.action('waitForTextMatch', function waitForTextMatch(selector, matchWord, done) {
  this.wait(
    (elementToSelect, word) => {
      return (
        document.querySelector(elementToSelect) &&
        document.querySelector(elementToSelect).innerText &&
        document.querySelector(elementToSelect).innerText.match(word)
      );
    },
    selector,
    matchWord
  )
    .evaluate(elementToSelect => {
      const helpers = document.__helpers;
      return helpers.querySelector(elementToSelect).innerText;
    }, selector)
    .then(v => {
      done(null, v);
    });
});

Nightmare.action('waitToBeGone', function waitToBeGone(selector, done) {
  this.wait(elementToSelect => {
    const elems = document.querySelectorAll(elementToSelect);
    return !elems || !elems.length;
  }, selector).then(() => {
    done();
  });
});

Nightmare.action('getInnerText', function getInnerText(selector, done) {
  this.wait(selector).evaluate_now(
    elementToSelect => {
      const helpers = document.__helpers;
      return helpers.querySelector(elementToSelect).innerText;
    },
    done,
    selector
  );
});

Nightmare.action('getInnerHtml', function getInnerHtml(selector, done) {
  this.wait(selector).evaluate_now(
    elementToSelect => {
      const helpers = document.__helpers;
      return helpers.querySelector(elementToSelect).innerHTML;
    },
    done,
    selector
  );
});

Nightmare.action('selectText', function selectText(selector, done) {
  this.wait(selector)
    .evaluate(elementToSelect => {
      const range = document.createRange();
      range.selectNodeContents(document.querySelector(elementToSelect));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }, selector)
    .mouseup(selector)
    .then(() => {
      done();
    })
    .catch(done);
});

Nightmare.action('clickCardOnLibrary', function clickCardOnLibrary(itemName, done) {
  this.evaluate(nameToFind => {
    const cards = document.querySelectorAll(
      '.main-wrapper div.item-document,.main-wrapper div.item-document'
    );
    let found = false;
    cards.forEach(card => {
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
  }, itemName).then(() => {
    done();
  });
});

Nightmare.action('getResultsAsJson', function getResultsAsJson(done) {
  this.evaluate_now(() => {
    const normalizedCards = [];
    const cards = document.querySelectorAll(
      '.main-wrapper div.item-document, .main-wrapper div.item-document'
    );
    cards.forEach(card => {
      const normalized = {};
      normalized.title = card.querySelector('.item-name span').innerText;
      if (card.querySelector('.item-connection span')) {
        normalized.connectionType = card.querySelector('.item-connection span').innerText;
      }
      normalizedCards.push(normalized);
    });
    return normalizedCards;
  }, done);
});

Nightmare.action('openEntityFromLibrary', function openEntityFromLibrary(itemName, done) {
  this.evaluate(nameToFind => {
    const cards = document.querySelectorAll('.main-wrapper div.item-document');
    let found = false;
    cards.forEach(card => {
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
    .wait(selectors.entityView.contentHeaderTitle)
    .wait(
      elementToSelect => document.querySelector(elementToSelect).innerText,
      selectors.entityView.contentHeaderTitle
    )
    .then(() => {
      done();
    });
});

Nightmare.action('openDocumentFromLibrary', function openDocumentFromLibrary(itemName, done) {
  this.evaluate(nameToFind => {
    const cards = document.querySelectorAll('div.item-document');
    let found = false;
    cards.forEach(card => {
      if (found) {
        return;
      }
      if (card.innerText.match(nameToFind)) {
        found = card;
      }
    });

    if (found) {
      found.querySelector('div.item-actions > div > a').click();
    }
  }, itemName)
    .waitForText('#page-1 div.textLayer')
    .then(() => {
      done();
    });
});

Nightmare.action('editEntityFromEntityViewer', function editEntityFromEntityViewer(done) {
  this.waitToClick(selectors.entityView.editButton)
    .wait(selectors.entityView.metadataForm)
    .then(() => {
      done();
    });
});

Nightmare.action('editDocumentFromDocumentViewer', function editDocumentFromDocumentViewer(done) {
  this.waitToClick(selectors.documentView.editButton)
    .wait(selectors.documentView.metadataForm)
    .then(() => {
      done();
    });
});

Nightmare.action('saveEntityFromEntityViewer', function saveEntityFromEntityViewer(done) {
  this.waitToClick(selectors.entityView.saveButton)
    .wait(selectors.entityView.editButton)
    .then(() => {
      done();
    });
});

Nightmare.action('saveFromDocumentViewer', function saveFromDocumentViewer(done) {
  this.waitToClick(selectors.documentView.saveButton)
    .wait(selectors.documentView.editButton)
    .then(() => {
      done();
    });
});

Nightmare.action('openSidePanelOnDocumentViewer', function openSidePanelOnDocumentViewer(done) {
  this.waitToClick(selectors.documentView.openSidePanelButton)
    .wait(selectors.documentView.sidePanelTitle)
    .then(() => {
      done();
    });
});

Nightmare.action('pickToday', function pickToday(input, done) {
  this.waitToClick(input)
    .wait(selectors.datePicker.today)
    .click(selectors.datePicker.today)
    .wait(elementToSelect => document.querySelector(elementToSelect).value, input)
    .then(() => {
      done();
    });
});

Nightmare.action('clickLink', function clickLink(label, done) {
  this.evaluate(nameToFind => {
    const links = document.querySelectorAll('a, button');
    let found = false;
    links.forEach(link => {
      if (found) {
        return;
      }
      if (link.innerText.match(nameToFind)) {
        found = link;
      }
    });

    if (found) {
      found.click();
    } else {
      throw new Error(`Link with label "${nameToFind}" NOT FOUND !`);
    }
  }, label).then(() => {
    done();
  });
});
