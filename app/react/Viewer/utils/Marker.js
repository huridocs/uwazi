import { isClient } from '#app/utils/index.js';
import Mark from 'mark.js';

if (isClient) {
  window.Marker = Mark;
}

let marker;
export default {
  init(selector) {
    if (!isClient) {
      return;
    }
    marker = new Mark(selector);
    window.Marker = marker;
  },

  markRegExp(regexp, options) {
    marker.markRegExp(regexp, options);
  },

  mark(text, options) {
    marker.mark(text, options);
  },

  unmark() {
    marker.unmark();
  },
};
