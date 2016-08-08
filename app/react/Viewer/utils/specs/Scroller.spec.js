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
    ul.style.height = '100px';
    ul.style.overflow = 'scroll';
    ul.style.padding = '0';
    ul.style.margin = '0';
    firstLi = document.createElement('li');
    secondLi = document.createElement('li');
    thirdLi = document.createElement('li');
    ul.appendChild(firstLi);
    ul.appendChild(secondLi);
    ul.appendChild(thirdLi);
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
      firstLi.style.height	= '120px';

      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(false);
      cleanDom();
    });

    it('should return false when the element is hidden because scroll is down', () => {
      firstLi.style.height	= '10px';
      secondLi.style.height	= '10px';
      thirdLi.style.height	= '100px';
      ul.scrollTop = 50;
      expect(scroller.isVisible('li:nth-child(1)', 'ul')).toBe(false);
      cleanDom();
    });

    it('should return true when the element is completely visible', () => {
      firstLi.style.height	= '120px';
      ul.scrollTop = 60;
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
    it('should scroll the parent to make the element visible', (done) => {
      firstLi.style.height	= '120px';
      scroller.to('li:nth-child(2)', 'ul', {duration: 0});
      window.setTimeout(() => {
        expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
        cleanDom();
        done();
      }, 26);
    });

    it('should do nothing if the element is visible', () => {
      firstLi.style.height	= '100px';
      secondLi.style.height	= '40px';
      thirdLi.style.height	= '40px';
      ul.scrollTop = 80;
      expect(scroller.isVisible('li:nth-child(2)', 'ul')).toBe(true);
      scroller.to('li:nth-child(2)', 'ul');
      expect(ul.scrollTop).toBe(80);
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
