export default {
  getElement(selector) {
    return document.querySelector(selector);
  },

  isVisible(selector, parentSelector) {
    let element = this.getElement(selector);
    let parent = this.getElement(parentSelector);
    let elementOffsetToParent = element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;

    return parent.offsetHeight + parent.scrollTop >= elementOffsetToParent + element.scrollHeight &&
     parent.scrollTop <= elementOffsetToParent;
  },

  to(selector, parentSelector, opt = {}) {
    let options = this.getOptions(opt);
    if (this.isVisible(selector, parentSelector)) {
      return;
    }
    let element = this.getElement(selector);
    let parent = this.getElement(parentSelector);
    let elementOffsetToParent = element.getBoundingClientRect().top - parent.getBoundingClientRect().top + parent.scrollTop;

    let parentVisibleScroll = parent.scrollHeight - parent.offsetHeight;
    let elementPositionInParent = parent.scrollHeight - elementOffsetToParent;

    let scrollTop = parentVisibleScroll - elementPositionInParent + options.offset + element.scrollHeight + (parent.offsetHeight - element.offsetHeight) / 2;

    let start = Date.now();
    let timeout = window.setInterval(() => {
      let t = (Date.now() - start) / options.duration;
      let multiplier = this[options.animation](t);
      parent.scrollTop += multiplier * (scrollTop - parent.scrollTop);
      if (multiplier >= 0.9) {
        parent.scrollTop = scrollTop;
        window.clearInterval(timeout);
      }
    }, 25);
  },

  getOptions(options) {
    let defaultOptions = {duration: 400, offset: 0, animation: 'easeIn'};
    return Object.assign(defaultOptions, options);
  },

  easeIn(t) {
    return t * t;
  },

  easeOut(t) {
    return t * (2 - t);
  }
};
