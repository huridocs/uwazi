import TextRange from 'batarange';
import wrapper from 'app/utils/wrapper';

export default function (container) {
  return {
    container,
    renderedReferences: {},
    highlightedReference: null,

    selected() {
      return window.getSelection().toString() !== '';
    },

    getSelection() {
      let range = window.getSelection().getRangeAt(0);
      return TextRange.serialize(range, container);
    },

    highlight(referenceId) {
      if (this.highlightedReference) {
        this.renderedReferences[this.highlightedReference].nodes.forEach((node) => {
          node.classList.remove('highlighted');
        });
      }

      if (referenceId) {
        this.renderedReferences[referenceId].nodes.forEach((node) => {
          node.classList.add('highlighted');
        });
      }

      this.highlightedReference = referenceId;
    },

    simulateSelection(range) {
      this.removeSimulatedSelection();
      if (!range || this.selected()) {
        return;
      }

      let restoredRange = TextRange.restore(range, container);
      let elementWrapper = document.createElement('span');
      elementWrapper.classList.add('fake-selection');
      this.fakeSelection = wrapper.wrap(elementWrapper, restoredRange);
    },

    removeSimulatedSelection() {
      if (this.fakeSelection) {
        this.removeSelection();
        this.fakeSelection.unwrap();
        this.fakeSelection = null;
      }
    },

    isSelectionOnContainer() {
      let node = window.getSelection().parentNode;
      while (node && node !== this.container && node.nodeName !== 'BODY') {
        node = node.parentNode;
      }

      return node === this.container;
    },

    removeSelection() {
      if (!this.selected() || !this.isSelectionOnContainer()) {
        return;
      }
      if (window.getSelection) {
        if (window.getSelection().empty) {
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          window.getSelection().removeAllRanges();
        }
      }
    },

    renderReferences(references) {
      let ids = [];
      references.forEach((reference) => {
        ids.push(reference._id);
        if (this.renderedReferences[reference._id]) {
          return;
        }
        let restoredRange = TextRange.restore(reference.sourceRange, container);
        let elementWrapper = document.createElement('a');
        elementWrapper.classList.add('reference');
        elementWrapper.setAttribute('x-id', reference._id);
        this.renderedReferences[reference._id] = wrapper.wrap(elementWrapper, restoredRange);
      });

      Object.keys(this.renderedReferences).forEach((id) => {
        if (ids.indexOf(id) === -1) {
          this.renderedReferences[id].unwrap();
          delete this.renderedReferences[id];
        }
      });
    }
  };
}
