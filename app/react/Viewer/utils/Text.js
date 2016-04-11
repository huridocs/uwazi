import TextRange from 'batarange';
import wrapper from 'app/utils/wrapper';

export default function (container) {
  return {
    container,

    selected() {
      return window.getSelection().toString() !== '';
    },

    getSelection() {
      let range = window.getSelection().getRangeAt(0);
      return TextRange.serialize(range, container);
    },

    simulateSelection(range) {
      this.removeSimulatedSelection();
      if (!range) {
        return;
      }

      let restoredRange = TextRange.restore(range, container);
      let elementWrapper = document.createElement('span');
      elementWrapper.classList.add('fake-selection');
      this.fakeSelection = wrapper.wrap(elementWrapper, restoredRange);
      this.removeSelection();
    },

    removeSimulatedSelection() {
      if (this.fakeSelection) {
        this.fakeSelection.unwrap();
        this.fakeSelection = null;
      }
    },

    removeSelection() {
      if (window.getSelection) {
        if (window.getSelection().empty) {
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          window.getSelection().removeAllRanges();
        }
      }
    }
  };
}
