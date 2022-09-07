import React, { LegacyRef, useEffect } from 'react';

interface StickyHeaderProps {
  children: Function;
  scrollElementSelector: string;
}

// eslint-disable-next-line max-statements
const stickHeader = (self: any, event: Event) => {
  if (self) {
    self.current?.classList.remove('sticky');
    // @ts-ignore
    const scrollerTop = event.target?.scrollTop || 0;
    const stickyTop = self.current?.offsetTop || 0;
    const stickyBottom = stickyTop + (self.current?.offsetHeight || 0);

    if (stickyTop <= scrollerTop && stickyBottom > scrollerTop) {
      self.current?.classList.add('sticky');
    }
  }
};

const StickyHeader = (props: StickyHeaderProps) => {
  const { children, scrollElementSelector } = props;
  const self: LegacyRef<HTMLDivElement> = React.createRef();
  const body = document.querySelector<HTMLDivElement>(scrollElementSelector);
  const parentTop = ((body?.offsetParent as HTMLElement).offsetTop || 0) + (body?.offsetTop || 0);
  useEffect(() => {
    body?.addEventListener('scroll', event => stickHeader(self, event));
    return () => {
      body?.removeEventListener('scroll', event => stickHeader(self, event));
    };
  });

  return <div ref={self}>{children({ style: { top: parentTop } })}</div>;
};

export { StickyHeader };
