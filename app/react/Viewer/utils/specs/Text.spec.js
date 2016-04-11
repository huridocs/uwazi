import TextRange from 'batarange';

import Text from 'app/Viewer/utils/Text';
import mockRangeSelection from 'app/utils/mockRangeSelection';
import wrapper from 'app/utils/wrapper';

describe('Text', () => {
  let text;

  beforeEach(() => {
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
      spyOn(TextRange, 'serialize').and.returnValue('serializedRange');
      let range = mockRangeSelection('text');

      let serializedRange = text.getSelection();
      expect(serializedRange).toEqual('serializedRange');
      expect(TextRange.serialize).toHaveBeenCalledWith(range, document);
    });
  });

  describe('simulateSelection', () => {
    it('should wrap the range with a span.fake-selection', () => {
      spyOn(wrapper, 'wrap').and.returnValue('fakeSelection');
      spyOn(TextRange, 'restore').and.returnValue('restoredRange');
      spyOn(text, 'removeSelection');
      spyOn(text, 'removeSimulatedSelection');

      text.simulateSelection('range');

      let elementWrapper = document.createElement('span');
      elementWrapper.classList.add('fake-selection');

      expect(TextRange.restore).toHaveBeenCalledWith('range', document);
      expect(wrapper.wrap).toHaveBeenCalledWith(elementWrapper, 'restoredRange');
      expect(text.fakeSelection).toBe('fakeSelection');
      expect(text.removeSelection).toHaveBeenCalled();
      expect(text.removeSimulatedSelection).toHaveBeenCalled();
    });

    describe('when selection passed is null', () => {
      it('should remove current fakeSelection', () => {
        spyOn(text, 'removeSimulatedSelection');
        text.simulateSelection(null);

        expect(text.removeSimulatedSelection).toHaveBeenCalled();
      });
    });
  });

  describe('removeSimulatedSelection', () => {
    it('should unwrap fake selection and set fakeSelection to null', () => {
      let unwrap = jasmine.createSpy('unwrap');
      text.fakeSelection = {unwrap};
      text.removeSimulatedSelection();

      expect(unwrap).toHaveBeenCalled();
      expect(text.fakeSelection).toBe(null);
    });

    describe('when no fakeSelection', () => {
      it('should not throw an error', () => {
        expect(text.removeSimulatedSelection.bind(text)).not.toThrow();
      });
    });
  });
});
