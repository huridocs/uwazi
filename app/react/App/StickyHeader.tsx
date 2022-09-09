import React, { LegacyRef, ReactElement, useEffect } from 'react';

interface StickyHeaderProps {
  children: ReactElement;
  scrollElementSelector: string;
  stickyElementSelector: string;
}

// eslint-disable-next-line max-statements
const eventHandler = (self: any, stickyElementSelector: string, event: Event) => {
  if (self && self.current && event.target && event.target instanceof Element) {
    const { target } = event;
    const { current } = self;
    const stickyElement: HTMLElement = current.querySelector(stickyElementSelector);
    const parentTop = target.getBoundingClientRect().top;
    current.classList.remove('sticky');
    const scrollerTop = target.scrollTop;
    const stickyTop = current.offsetTop || 0;
    const stickyBottom = stickyTop + current.offsetHeight;

    if (stickyTop < scrollerTop && stickyBottom > scrollerTop) {
      current.classList.add('sticky');
      if (stickyElement) {
        stickyElement.style.top = `${parentTop}px`;
      }
    }
  }
};

const StickyHeader = (props: StickyHeaderProps) => {
  const { children, scrollElementSelector, stickyElementSelector } = props;
  const self: LegacyRef<HTMLDivElement> = React.createRef();
  const body = document.querySelector<HTMLDivElement>(scrollElementSelector);
  useEffect(() => {
    body?.addEventListener('scroll', event => {
      eventHandler(self, stickyElementSelector, event);
    });

    return () => {
      body?.removeEventListener('scroll', event =>
        eventHandler(self, stickyElementSelector, event)
      );
    };
  });

  return <div ref={self}>{children}</div>;
};

export { StickyHeader };
