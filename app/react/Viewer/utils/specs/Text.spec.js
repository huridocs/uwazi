import TextRange from 'batarange';

import Text from 'app/Viewer/utils/Text';
import mockRangeSelection from 'app/utils/mockRangeSelection';
import wrapper from 'app/utils/wrapper';

fdescribe('Text', () => {
  let text;

  beforeEach(() => {
    document.innerHTML = '<span></span>';
    text = Text(document);
  });

  describe('selected()', () => {
    it('should return true if text selected', () => {
      mockRangeSelection('text_selected');
      expect(text.selected()).toBe(true);
    });
    it('should return false if no text selected', () => {
      mockRangeSelection('');
      expect(text.selected()).toBe(false);
    });
  });

  describe('getSelection', () => {
    it('should return a serialized selection', () => {
      spyOn(TextRange, 'serialize').and.returnValue({start: 1, end: 10});
      let range = mockRangeSelection('text');

      let serializedRange = text.getSelection();
      expect(serializedRange).toEqual({start: 1, end: 10, text: 'text'});
      expect(TextRange.serialize).toHaveBeenCalledWith(range, document);
    });

    describe('with range', () => {
      it('should return serialized selection adding offset', () => {
        spyOn(TextRange, 'serialize').and.returnValue({start: 1, end: 10});
        let range = mockRangeSelection('text');
        text.range({start: 10});

        let serializedRange = text.getSelection();
        expect(serializedRange).toEqual({start: 11, end: 20, text: 'text'});
        expect(TextRange.serialize).toHaveBeenCalledWith(range, document);
      });
    });
  });

  describe('simulateSelection', () => {
    describe('when there is no selection', () => {
      it('should wrap the range with a span.fake-selection', () => {
        spyOn(wrapper, 'wrap').and.returnValue('fakeSelection');
        spyOn(TextRange, 'restore').and.returnValue('restoredRange');
        spyOn(text, 'selected').and.returnValue(false);
        spyOn(text, 'removeSimulatedSelection');

        text.range({start:0, end: 90});
        text.simulateSelection({start: 1, end: 2});

        let elementWrapper = document.createElement('span');
        elementWrapper.classList.add('fake-selection');

        expect(TextRange.restore).toHaveBeenCalledWith({start: 1, end: 2}, document);
        expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper, 'restoredRange');
        expect(text.fakeSelection).toBe('fakeSelection');
        expect(text.removeSimulatedSelection).toHaveBeenCalled();
      });

      describe('when the range rendered does not match the range selected', () => {
        it('should not render the selection', () => {
          spyOn(wrapper, 'wrap').and.returnValue('fakeSelection');
          spyOn(TextRange, 'restore').and.returnValue('restoredRange');
          spyOn(text, 'selected').and.returnValue(false);
          spyOn(text, 'removeSimulatedSelection');

          text.range({start:0, end: 10});
          text.simulateSelection({start:15, end: 25});

          expect(TextRange.restore).not.toHaveBeenCalled();
        });
      });
    });

    describe('when selection passed is null', () => {
      it('should only remove current fakeSelection', () => {
        spyOn(text, 'removeSimulatedSelection');
        spyOn(wrapper, 'wrap');
        text.simulateSelection(null);

        expect(text.removeSimulatedSelection).toHaveBeenCalled();
        expect(wrapper.wrap).not.toHaveBeenCalled();
      });
    });

    describe('when there is text selected', () => {
      it('should only remove current fakeSelection', () => {
        spyOn(text, 'removeSimulatedSelection');
        spyOn(wrapper, 'wrap');
        spyOn(text, 'selected').and.returnValue(true);

        text.simulateSelection({});

        expect(text.removeSimulatedSelection).toHaveBeenCalled();
        expect(wrapper.wrap).not.toHaveBeenCalled();
      });
    });
  });

  describe('removeSimulatedSelection', () => {
    it('should unwrap fake selection, fakeSelection to null and remove real selection', () => {
      let unwrap = jasmine.createSpy('unwrap');
      spyOn(text, 'removeSelection');
      text.fakeSelection = {unwrap};
      text.removeSimulatedSelection();

      expect(text.removeSelection).toHaveBeenCalled();
      expect(unwrap).toHaveBeenCalled();
      expect(text.fakeSelection).toBe(null);
    });

    describe('when no fakeSelection', () => {
      it('should not throw an error', () => {
        expect(text.removeSimulatedSelection.bind(text)).not.toThrow();
      });
    });
  });

  describe('renderReferences', () => {
    let unwrap;

    let elementWrapper = (id, className = 'reference') => {
      let element = document.createElement('a');
      element.classList.add(className);
      element.setAttribute('data-id', id);
      return element;
    };

    beforeEach(() => {
      unwrap = jasmine.createSpy('unwrap');
      spyOn(wrapper, 'wrap').and.returnValue({unwrap});
      spyOn(TextRange, 'restore').and.returnValue('restoredRange');
    });

    describe('when a reference has no range to render', () => {
      it('should not throw an error', () => {
        let references = [{_id: '1'}];

        text.renderReferences(references);
        expect(TextRange.restore).not.toHaveBeenCalled();
      });
    });

    describe('when container does not have any html', () => {
      it('should throw an error', () => {
        document.innerHTML = '';
        text = Text(document);
        let references = [{_id: '1', range: 'sourceRange1'}, {_id: '2', range: 'sourceRange2'}];

        expect(text.renderReferences.bind(text, references)).toThrow();
      });
    });

    it('should wrap a collection of references using range by default', () => {
      let references = [{_id: '1', range: 'sourceRange1'}, {_id: '2', range: 'sourceRange2'}];

      text.renderReferences(references);
      expect(TextRange.restore).toHaveBeenCalledWith('sourceRange1', document);
      expect(TextRange.restore).toHaveBeenCalledWith('sourceRange2', document);
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('1'), 'restoredRange');
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('2'), 'restoredRange');
    });

    it('should wrap a collection of references using identifier passed', () => {
      let references = [{_id: '1', range: 'targetRange1'}, {_id: '2', range: 'targetRange2'}];

      text.renderReferences(references, 'identifier');
      expect(TextRange.restore).toHaveBeenCalledWith('targetRange1', document);
      expect(TextRange.restore).toHaveBeenCalledWith('targetRange2', document);
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('1', 'identifier'), 'restoredRange');
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('2', 'identifier'), 'restoredRange');
    });

    it('should not render references already rendered', () => {
      let firstReferneces = [{_id: '1', range: 'sourceRange1'}, {_id: '2', range: 'sourceRange2'}];
      let secondReferences = [
        {_id: '1', range: 'sourceRange1'}, {_id: '2', range: 'sourceRange2'}, {_id: '3', range: 'sourceRange3'}
      ];
      text.renderReferences(firstReferneces);
      TextRange.restore.calls.reset();
      wrapper.wrap.calls.reset();
      text.renderReferences(secondReferences);

      expect(TextRange.restore.calls.count()).toBe(1);
      expect(wrapper.wrap.calls.count()).toBe(1);
      expect(TextRange.restore).toHaveBeenCalledWith('sourceRange3', document);
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('3'), 'restoredRange');
    });

    it('should unwrap references that are passed by propertyRange in multiple calls', () => {
      let firstReferneces = [{_id: '1', range: 'sourceRange1'}, {_id: '2', range: 'sourceRange2'}];
      let secondReferences = [{_id: '2', range: 'sourceRange2'}, {_id: '3', range: 'sourceRange3'}];
      text.renderReferences(firstReferneces);
      text.renderReferences(secondReferences);
      text.renderReferences([], 'targetRange');

      expect(unwrap.calls.count()).toBe(1);
      expect(text.renderedReferences.reference[1]).not.toBeDefined();
    });

    describe('with range', () => {
      it('should only render references inside the range adding the start offset of the range being rendered', () => {
        let references = [
          {_id: '1', range: {start: 14, end: 45}}, 
          {_id: '2', range: {start: 4, end: 16}},
          {_id: '3', range: {start: 3, end: 5}},
          {_id: '4', range: {start: 56, end: 60}}
        ];

        text.range({start: 10, end: 55});
        text.renderReferences(references);
        expect(TextRange.restore).toHaveBeenCalledWith({start: 4, end: 35}, document);
        expect(TextRange.restore).toHaveBeenCalledWith({start: 0, end: 6}, document);
        expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('1'), 'restoredRange');
        expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper('2'), 'restoredRange');
      });
    });
  });

  describe('highlight', () => {
    let createElement = () => {
      return document.createElement('a');
    };

    beforeEach(() => {
      text.renderedReferences = {
        targetRange: {
          reference1: {
            nodes: [createElement(), createElement()]
          }
        },
        sourceRange: {
          reference2: {
            nodes: [createElement(), createElement(), createElement()]
          }
        }
      };
    });

    it('should add class highlighted to all nodes of a reference', () => {
      text.highlight('reference2');

      expect(text.renderedReferences.sourceRange.reference2.nodes[0].className).toBe('highlighted');
      expect(text.renderedReferences.sourceRange.reference2.nodes[1].className).toBe('highlighted');
    });

    it('should handle unexistant references', () => {
      expect(text.highlight.bind(text, 'reference_unexistant')).not.toThrow();
    });

    it('should toggle highlighting when new reference is passed', () => {
      text.highlight('reference2');
      text.highlight('reference1');

      expect(text.renderedReferences.sourceRange.reference2.nodes[0].className).toBe('');
      expect(text.renderedReferences.sourceRange.reference2.nodes[1].className).toBe('');
      expect(text.renderedReferences.targetRange.reference1.nodes[0].className).toBe('highlighted');
      expect(text.renderedReferences.targetRange.reference1.nodes[1].className).toBe('highlighted');
    });

    describe('when passing null', () => {
      it('should not throw an error', () => {
        expect(text.highlight.bind(text, null)).not.toThrow();
      });
    });
  });

  describe('activate', () => {
    let createElement = () => {
      return document.createElement('a');
    };

    beforeEach(() => {
      text.renderedReferences = {
        sourceRange: {
          reference1: {
            nodes: [createElement(), createElement()]
          }
        },
        targetRange: {
          reference2: {
            nodes: [createElement(), createElement(), createElement()]
          }
        }
      };
    });

    it('should add class is-active to all nodes of a reference', () => {
      text.activate('reference2');

      expect(text.renderedReferences.targetRange.reference2.nodes[0].className).toBe('is-active');
      expect(text.renderedReferences.targetRange.reference2.nodes[1].className).toBe('is-active');
    });

    it('should handle unexistant references', () => {
      expect(text.activate.bind(text, 'reference_unexistant')).not.toThrow();
    });

    it('should toggle activate when new reference is passed', () => {
      text.activate('reference2');
      text.activate('reference1');

      expect(text.renderedReferences.targetRange.reference2.nodes[0].className).toBe('');
      expect(text.renderedReferences.targetRange.reference2.nodes[1].className).toBe('');
      expect(text.renderedReferences.sourceRange.reference1.nodes[0].className).toBe('is-active');
      expect(text.renderedReferences.sourceRange.reference1.nodes[1].className).toBe('is-active');
    });

    describe('when passing null', () => {
      it('should not throw an error', () => {
        expect(text.activate.bind(text, null)).not.toThrow();
      });
    });
  });
});
