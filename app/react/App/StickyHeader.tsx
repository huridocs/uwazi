import React, { LegacyRef, ReactElement, useEffect } from 'react';

interface StickyHeaderProps {
  children: ReactElement;
  scrollElementSelector: string;
  stickyElementSelector: string;
}

// eslint-disable-next-line max-statements
const eventHandler = (self: any, stickyElementSelector: string, event: Event) => {
  if (self && self.current && event.target) {
    const stickyElement = self.current.querySelector(stickyElementSelector) as HTMLElement;
    const parentTop = (event.target as HTMLElement).getBoundingClientRect().top;
    self.current.classList.remove('sticky');
    const scrollerTop = (event.target as HTMLElement).scrollTop;
    const stickyTop = self.current.offsetTop || 0;
    const stickyBottom = stickyTop + self.current.offsetHeight;

    if (stickyTop < scrollerTop && stickyBottom > scrollerTop) {
      self.current.classList.add('sticky');
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
