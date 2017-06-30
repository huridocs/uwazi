import {isClient} from 'app/utils';

let Mark;
if (isClient) {
  Mark = require('mark.js');
}

let marker;
export default {
  init(selector) {
    marker = new Mark(selector);
  },

  mark(text) {
    marker.mark(text);
  },

  unmark() {
    marker.unmark();
  }
}
