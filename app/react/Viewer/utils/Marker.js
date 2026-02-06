import Mark from 'mark.js';
import { isClient } from '#app/utils/index.js';

let marker;
export default {
  init(selector) {
    if (!isClient) return;
    marker = new Mark(selector);
    window.Marker = marker;
  },

  markRegExp(regexp, options) {
    if (marker) marker.markRegExp(regexp, options);
  },

  mark(text, options) {
    if (marker) marker.mark(text, options);
  },

  unmark() {
    if (marker) marker.unmark();
  },
};
