const box = (bottom: number, top = 0): DOMRect => ({
  x: 0,
  y: top,
  top,
  left: 0,
  right: 0,
  bottom,
  width: 0,
  height: bottom - top,
  toJSON: () => ({}),
});

const ancestorScroll = (node: HTMLElement | null): number => {
  if (!node) return 0;
  const scrolls = node.style.overflowY === 'auto' || node.style.overflowY === 'scroll';
  return (scrolls ? node.scrollTop : 0) + ancestorScroll(node.parentElement);
};

const mockListPastPane = (listBottom = () => 340) => {
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  rect.mockImplementation(function mockRect(this: HTMLElement) {
    if (this.getAttribute('role') === 'listbox') {
      return box(listBottom() - ancestorScroll(this.parentElement));
    }
    const clips = ['auto', 'scroll', 'hidden'].includes(this.style.overflowY);
    return box(clips ? 100 : 0);
  });
  return rect;
};

const clampScroll = (node: HTMLElement, limit: () => number) => {
  let stored = 0;
  Object.defineProperty(node, 'scrollTop', {
    configurable: true,
    get: () => stored,
    set: (value: number) => {
      stored = Math.min(value, limit());
    },
  });
};

const capThenRelease = (node: HTMLElement) => {
  let capped = true;
  clampScroll(node, () => (capped ? 10 : Number.POSITIVE_INFINITY));
  return () => {
    capped = false;
  };
};

const elementChild = (node: HTMLElement) => {
  const child = node.firstElementChild;
  if (!(child instanceof HTMLElement)) {
    throw new Error('missing scroller');
  }
  return child;
};

type Measure = number | (() => number);

const measured = (value: Measure) => (typeof value === 'function' ? value() : value);

const mockClip = (top: Measure, bottom: Measure, pane: (node: HTMLElement) => number) => {
  const rect = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect');
  rect.mockImplementation(function mockRect(this: HTMLElement) {
    if (this.getAttribute('role') === 'listbox') return box(measured(bottom), measured(top));
    return box(pane(this));
  });
  return rect;
};

export { capThenRelease, clampScroll, elementChild, mockClip, mockListPastPane };
