/**
 * @jest-environment jsdom
 */
import scroller from '../Scroller.js';

describe('scroller', () => {
  let container;
  let ul;
  let firstLi;
  let secondLi;
  let thirdLi;

  beforeEach(() => {
    container = document.createElement('div');
    container.className = 'container';
    ul = document.createElement('ul');
    ul.getBoundingClientRect = () => ({ top: 8, bottom: 108 });
    firstLi = document.createElement('li');
    secondLi = document.createElement('li');
    thirdLi = document.createElement('li');

    [
      [firstLi, { top: 8, bottom: 147 }],
      [secondLi, { top: 148, bottom: 248 }],
      [thirdLi, { top: 249, bottom: 300 }],
    ].forEach(([_li, bounds]) => {
      const li = _li;
      li.getBoundingClientRect = () => bounds;
      ul.appendChild(li);
    });
    container.appendChild(ul);
    document.body.appendChild(container);
  });

  const cleanDom = () => {
    document.body.removeChild(container);
  };

  describe('getElement()', () => {
    it('should return the first element matching the selector', () => {
      expect(scroller.getElement('.container')).toBe(container);
      expect(scroller.getElement('.container li')).toBe(firstLi);
      expect(scroller.getElement('.container li:nth-child(2)')).toBe(secondLi);
      cleanDom();
    });
  });

  describe('isVisible()', () => {
    it('should return false when the element is hidden because scroll is up', () => {
      secondLi.getBoundingClientRect = () => ({ top: 128, bottom: 248 });

      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(false);
      cleanDom();
    });

    it('should return false when the element is hidden because scroll is down', () => {
      firstLi.getBoundingClientRect = () => ({ top: -28, bottom: 7 });

      expect(scroller.isVisible('li:nth-child(1)', 'ul')).toBe(false);
      cleanDom();
    });

    it('should return true when the element is completely visible', () => {
      secondLi.getBoundingClientRect = () => ({ top: 10, bottom: 100 });
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      cleanDom();
    });

    it('should return true when the top part of the element is hidden but the bottom is visible', () => {
      secondLi.getBoundingClientRect = () => ({ top: -10, bottom: 100 });
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      cleanDom();
    });

    it('should return true when the top part of the element is visible but the bottom is hidden', () => {
      secondLi.getBoundingClientRect = () => ({ top: 56, bottom: 150 });
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      cleanDom();
    });

    it('should return true if the top and bottom parts are hidden but the middle is visible', () => {
      secondLi.getBoundingClientRect = () => ({ top: -10, bottom: 140 });
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      cleanDom();
    });

    describe('when an element does not exists', () => {
      it('should returns false', () => {
        expect(scroller.isVisible('li:nth-child(2)', 'i-dont-exists')).toBe(false);
        expect(scroller.isVisible('i-dont-exists', 'ul')).toBe(false);
      });
    });
  });

  describe('to()', () => {
    it('should scroll the parent to make the element visible', done => {
      jest.spyOn(scroller, 'isVisible').mockReturnValue(false);
      scroller.to('li:nth-child(2)', 'ul', { duration: 0 });
      window.setTimeout(() => {
        expect(scroller.isVisible).toHaveBeenCalledWith('li:nth-child(2)', 'ul');
        expect(document.querySelector('ul').scrollTop).toBe(140);
        cleanDom();
        done();
      }, 26);
    });

    it('should do nothing if the element is visible', () => {
      jest.spyOn(scroller, 'isVisible').mockReturnValue(true);
      document.querySelector('ul').scrollTop = 80;
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      scroller.to('li:nth-child(2)', 'ul');
      expect(scroller.isVisible).toHaveBeenCalledWith('li:nth-child(2)', 'ul');
      expect(document.querySelector('ul').scrollTop).toBe(80);
      cleanDom();
    });

    describe('when one of the elements does not exists', () => {
      it('should do nothing', () => {
        expect(scroller.to.bind(scroller, 'li:nth-child(2)', 'i-dont-exists')).not.toThrow();
        expect(scroller.to.bind(scroller, 'i-dont-exists', 'ul')).not.toThrow();
        cleanDom();
      });
    });
  });
});
