export default {
  getElement(selector) {
    return document.querySelector(selector);
  },

  isVisible(selector, parentSelector) {
    const element = this.getElement(selector);
    const parent = this.getElement(parentSelector);

    if (!parent || !element) {
      return false;
    }

    const elementBounds = element.getBoundingClientRect();
    const parentBounds = parent.getBoundingClientRect();
    return (
      (elementBounds.top < parentBounds.top && elementBounds.bottom > parentBounds.top) ||
      (elementBounds.top > parentBounds.top && elementBounds.top < parentBounds.bottom)
    );
  },

  to(selector, parentSelector, opt = {}) {
    const options = this.getOptions(opt);
    if (this.isVisible(selector, parentSelector) && !options.force) {
      return Promise.resolve();
    }

    const element = this.getElement(selector);
    const parent = this.getElement(parentSelector);

    if (!parent || !element) {
      return Promise.resolve();
    }
    const scrollTop = this.getTargetScrollTop(element, parent, options);
    return this.animateScroll(parent, scrollTop, options);
  },

  getTargetScrollTop(element, parent, options) {
    const elementOffsetToParent =
      element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;
    const parentVisibleScroll = parent.scrollHeight - parent.offsetHeight;
    const elementPositionInParent = parent.scrollHeight - elementOffsetToParent;
    return (
      parentVisibleScroll -
      elementPositionInParent +
      options.offset +
      element.scrollHeight +
      (parent.offsetHeight - element.offsetHeight) / options.dividerOffset
    );
  },

  animateScroll(_parent, scrollTop, options) {
    const parent = _parent;
    const start = Date.now();
    return new Promise(resolve => {
      const timeout = window.setInterval(() => {
        const t = (Date.now() - start) / options.duration;
        const multiplier = this[options.animation](t);
        parent.scrollTop += multiplier * (scrollTop - parent.scrollTop);
        if (multiplier >= 0.9) {
          parent.scrollTop = scrollTop;
          window.clearInterval(timeout);
          resolve();
        }
      }, 25);

      resolve(timeout);
    });
  },

  getOptions(options) {
    const defaultOptions = {
      duration: 400,
      offset: 0,
      animation: 'easeIn',
      dividerOffset: 2,
      force: false,
    };
    return Object.assign(defaultOptions, options);
  },

  easeIn(t) {
    return t * t;
  },

  easeOut(t) {
    return t * (2 - t);
  },
};
