import TextRange from 'batarange';
import wrapper from 'app/utils/wrapper';
import { events } from 'app/utils';

export default function(container) {
  return {
    charRange: { start: null, end: null },
    container,
    renderedReferences: {},
    highlightedReference: null,

    selected() {
      return window.getSelection().toString() !== '';
    },

    range(charRange) {
      this.charRange = charRange;
    },

    getSelection() {
      const selection = window.getSelection();
      const range = selection.getRangeAt(0);
      const serializedRange = TextRange.serialize(range, container);
      serializedRange.start += this.charRange.start;
      serializedRange.end += this.charRange.start;
      serializedRange.text = selection.toString().replace(/\s+/g, ' ');
      return serializedRange;
    },

    searchRenderedReference(referenceId) {
      let reference = null;
      Object.keys(this.renderedReferences).forEach(referencesKey => {
        if (this.renderedReferences[referencesKey][referenceId]) {
          reference = this.renderedReferences[referencesKey][referenceId];
        }
      });
      return reference;
    },

    highlight(referenceId) {
      const reference = this.searchRenderedReference(referenceId);
      const highlightedReference = this.searchRenderedReference(this.highlightedReference);

      if (highlightedReference) {
        highlightedReference.nodes.forEach(node => {
          node.classList.remove('highlighted');
        });
      }

      if (reference) {
        reference.nodes.forEach(node => {
          node.classList.add('highlighted');
        });
      }

      this.highlightedReference = referenceId;
    },

    activate(referenceId) {
      const reference = this.searchRenderedReference(referenceId);
      const activeReference = this.searchRenderedReference(this.activeReference);

      if (activeReference) {
        activeReference.nodes.forEach(node => {
          node.classList.remove('is-active');
        });
      }

      if (reference) {
        reference.nodes.forEach(node => {
          node.classList.add('is-active');
        });
      }

      this.activeReference = referenceId;
    },

    isWithinCurrentRange(range) {
      return (
        (range.start >= this.charRange.start && range.start <= this.charRange.end) ||
        (range.end < this.charRange.end && range.end > this.charRange.start)
      );
    },

    wrapFakeSelection(range) {
      const offsetRange = Object.assign({}, range);
      offsetRange.start -= this.charRange.start;
      offsetRange.end -= this.charRange.start;

      const restoredRange = TextRange.restore(offsetRange, container);
      const elementWrapper = document.createElement('span');
      elementWrapper.classList.add('fake-selection');
      this.fakeSelection = wrapper.wrap(elementWrapper, restoredRange);
    },

    simulateSelection(range, force) {
      this.removeSimulatedSelection();
      if (!range || (this.selected() && !force)) {
        return;
      }

      if (this.isWithinCurrentRange(range)) {
        this.wrapFakeSelection(range);
      }
    },

    removeSimulatedSelection() {
      if (this.fakeSelection) {
        this.removeSelection();
        this.fakeSelection.unwrap();
        this.fakeSelection = null;
      }
    },

    isSelectionOnContainer() {
      let node = window.getSelection().baseNode;
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

    filterInRangeReferences(references, rangeProperty) {
      return references.filter(ref => {
        if (!ref[rangeProperty]) {
          return false;
        }
        if (this.charRange.start === null && this.charRange.end === null) {
          return false;
        }

        return (
          (ref[rangeProperty].start >= this.charRange.start &&
            ref[rangeProperty].start <= this.charRange.end) ||
          (ref[rangeProperty].end <= this.charRange.end &&
            ref[rangeProperty].end >= this.charRange.start)
        );
      });
    },

    groupReferencesByRange(references, rangeProperty) {
      const groupedRanges = {};
      references.forEach(ref => {
        const duplicateKey = `${ref[rangeProperty].start}${ref[rangeProperty].end}`;
        if (!groupedRanges[duplicateKey]) {
          groupedRanges[duplicateKey] = [];
        }
        groupedRanges[duplicateKey].push(ref);
      });
      return Object.keys(groupedRanges).map(key => {
        const _references = groupedRanges[key];
        const ref = { ids: _references.map(r => r._id) };
        ref[rangeProperty] = _references[0][rangeProperty];
        return ref;
      });
    },

    renderReferences(references, identifier = 'reference', elementWrapperType = 'a') {
      if (!container.innerHTML) {
        throw new Error(
          'Container does not have any html yet, make sure you are loading the html before the references'
        );
      }
      const rangeProperty = 'range';
      const ids = [];
      if (!this.renderedReferences[identifier]) {
        this.renderedReferences[identifier] = {};
      }

      const inRangeReferences = this.filterInRangeReferences(references, rangeProperty);

      const toRender = inRangeReferences.filter(ref => {
        ids.push(ref._id);
        return !this.renderedReferences[identifier][ref._id];
      });
      const groupedReferencesbyRange = this.groupReferencesByRange(toRender, rangeProperty);

      groupedReferencesbyRange.forEach(reference => {
        let ref = reference[rangeProperty];
        if (this.charRange.start) {
          // test the ref modifications are immutable !!!
          ref = Object.assign({}, reference[rangeProperty]);
          //
          ref.start -= this.charRange.start;
          ref.end -= this.charRange.start;
        }
        if (ref.start < 0) {
          ref.start = 0;
        }
        const restoredRange = TextRange.restore(ref, container);

        const elementWrapper = document.createElement(elementWrapperType);
        elementWrapper.classList.add(identifier);
        reference.ids.forEach(id => {
          elementWrapper.setAttribute(`data-${id}`, id);
        });
        elementWrapper.setAttribute('data-id', reference.ids[0]);
        const renderedReference = wrapper.wrap(elementWrapper, restoredRange);
        reference.ids.forEach(id => {
          this.renderedReferences[identifier][id] = renderedReference;
        });

        events.emit('referenceRendered', reference);
      });

      Object.keys(this.renderedReferences[identifier]).forEach(id => {
        if (ids.indexOf(id) === -1) {
          this.renderedReferences[identifier][id].unwrap();
          delete this.renderedReferences[identifier][id];
        }
      });
    },

    reset(identifier = 'reference') {
      if (!this.renderedReferences[identifier]) {
        this.renderedReferences[identifier] = {};
      }
      Object.keys(this.renderedReferences[identifier]).forEach(id => {
        this.renderedReferences[identifier][id].unwrap();
        delete this.renderedReferences[identifier][id];
      });
    },
  };
}
