//Sourced from https://www.xjavascript.com/blog/javascript-scrollintoview-only-in-immediate-parent

import { isClient } from '#app/utils/index.js';

type ScrollBehavior = 'smooth' | 'instant' | 'auto';
type ScrollBlock = 'start' | 'center' | 'end';

interface ScrollIntoViewOptions {
  behavior?: ScrollBehavior;
  block?: ScrollBlock;
}

const getImmediateScrollableParent = (element: Element): Element | null => {
  let parent = element.parentElement;
  while (parent) {
    const style = window?.getComputedStyle(parent);
    if (style && ['auto', 'scroll'].includes(style.overflowY)) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
};

/**
 *
 * Scrolls target element into view via the first scrollable ancestor that has overflowY = 'auto' | 'scroll'.
 * @param element target to scroll into view.
 * @param options ScrollIntoViewOptions.
 * @returns
 */
const scrollIntoView = (
  element: Element | null | undefined,
  options: ScrollIntoViewOptions = {}
): void => {
  if (!element || !isClient) return;

  const { behavior = 'instant', block = 'start' } = options;
  const parent = getImmediateScrollableParent(element);

  if (!parent) return;

  const elementRect = element.getBoundingClientRect();
  const parentRect = parent.getBoundingClientRect();
  const elementTopInParent = elementRect.top - parentRect.top + parent.scrollTop;

  let targetScrollTop: number;

  switch (block) {
    case 'center':
      targetScrollTop = elementTopInParent - (parent.clientHeight - elementRect.height) / 2;
      break;
    case 'end':
      targetScrollTop = elementTopInParent - parent.clientHeight + elementRect.height;
      break;
    default:
      targetScrollTop = elementTopInParent;
  }

  parent.scrollTo({ top: Math.max(0, targetScrollTop), behavior });
};

export { scrollIntoView };
