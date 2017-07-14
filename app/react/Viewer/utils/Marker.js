import {isClient} from 'app/utils';

let Mark;
if (isClient) {
  Mark = require('mark.js');
  window.Marker = Mark;
}


let marker;
export default {
  init(selector) {
    marker = new Mark(selector);
    if (isClient) {
      window.Marker = marker;
    }
  },

  markRegExp(regexp, options) {
    marker.markRegExp(regexp, options);
  },

  mark(text, options) {
    marker.mark(text, options);
  },

  unmark() {
    marker.unmark();
  }
};
