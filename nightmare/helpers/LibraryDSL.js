/* eslint import/no-extraneous-dependencies: ["error", {"peerDependencies": true}] */
import Nightmare from 'nightmare';
import selectors from './selectors.js';

let currentState;

Nightmare.action('library', {
  openCardSidePanel(matchingText, done) {
    this.evaluate(nameToFind => {
      const cards = document.querySelectorAll('.main-wrapper div.item');
      let found = false;
      cards.forEach(card => {
        if (found) {
          return;
        }
        if (card.innerText.toLowerCase().match(nameToFind.toLowerCase())) {
          found = card;
        }
      });

      if (found) {
        return found.click();
      }

      throw new Error(`Card with text "${nameToFind}" not found !`);
    }, matchingText).then(() => {
      done();
    });
  },

  selectFilter(matchingText, done) {
    this.library
      .setCurrentState()
      .waitToClick(`li[title*="${matchingText}" i] label`)
      .library.waitForSearchToFinish()
      .then(() => {
        done();
      });
  },

  editCard(matchingText, done) {
    this.library
      .openCardSidePanel(matchingText)
      .waitToClick(selectors.libraryView.editEntityButton)
      .then(() => {
        done();
      });
  },

  saveCard(done) {
    this.waitToClick(selectors.libraryView.saveButton)
      .waitForTheEntityToBeIndexed()
      .then(() => done());
  },

  clickFilter(selector, done) {
    this.library
      .setCurrentState()
      .waitToClick(selector)
      .library.waitForSearchToFinish()
      .then(() => {
        done();
      });
  },

  typeFilter(selector, text, done) {
    const enter = '\u000d';
    this.library
      .setCurrentState()
      .clearInput(selector)
      .write(selector, text)
      .type(selector, enter)
      .library.waitForSearchToFinish()
      .then(() => {
        done();
      });
  },

  waitForSearchToFinish(done) {
    this.wait(previousState => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.item-group .item-info'));
      if (!cards.length) {
        return false;
      }
      const state = cards.map(div => div.innerText).join('');

      return state !== previousState;
    }, currentState)
      .then(() => {
        done();
      })
      .catch(done);
  },

  countFiltersResults(done) {
    this.evaluate_now(() => document.querySelectorAll('.item-group .item').length, done);
  },

  setCurrentState(done) {
    this.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.item-group .item-info'));
      return cards.map(div => div.innerText).join('');
    }).then(state => {
      currentState = state;
      done();
    });
  },
});
