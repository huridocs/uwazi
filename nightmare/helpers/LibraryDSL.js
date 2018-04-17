import Nightmare from 'nightmare';

let currentState;

Nightmare.action('library', {
  clickFilter(selector, done) {
    this.library.setCurrentState()
    .waitToClick(selector)
    .library.waitForSearchToFinish()
    .then(done);
  },

  typeFilter(selector, text, done) {
    const enter = '\u000d';
    this.library.setCurrentState()
    .clearInput(selector)
    .write(selector, text)
    .type(selector, enter)
    .library.waitForSearchToFinish()
    .then(done);
  },

  waitForSearchToFinish(done) {
    this.wait((previousState) => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.item-group .item-info'));
      if (!cards.length) {
        return false;
      }
      const state = cards.map(div => div.innerText).join('');

      return state !== previousState;
    }, currentState)
    .then(done)
    .catch(done);
  },

  countFiltersResults(done) {
    this.evaluate_now(() => document.querySelectorAll('.item-group .item').length, done);
  },

  setCurrentState(done) {
    this.evaluate(() => {
      const cards = Array.prototype.slice.call(document.querySelectorAll('.item-group .item-info'));
      return cards.map(div => div.innerText).join('');
    })
    .then((state) => {
      currentState = state;
      done();
    });
  },
});
