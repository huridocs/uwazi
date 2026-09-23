import { useLayoutEffect, useRef, useState } from 'react';
import { MOBILE_VIEW_MAX_WIDTH, useIsMobile } from '#app/V2/CustomHooks/useIsMobile.js';

const useCompactBar = () => {
  const viewportMobile = Boolean(useIsMobile());
  const barRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = barRef.current;
    if (!element) return undefined;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const compact = width > 0 ? width <= MOBILE_VIEW_MAX_WIDTH : viewportMobile;
  return { barRef, compact };
};

export { useCompactBar };
