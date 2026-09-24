import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const useIsomorphicLayoutEffect = typeof document !== 'undefined' ? useLayoutEffect : useEffect;

const stripOverflows = (availableWidth: number, naturalWidth: number) =>
  availableWidth > 0 && naturalWidth > availableWidth;

const watchStrip = (avail: HTMLElement, probe: HTMLElement, onFold: (folded: boolean) => void) => {
  const measure = () => {
    onFold(
      stripOverflows(avail.getBoundingClientRect().width, probe.getBoundingClientRect().width)
    );
  };
  measure();
  if (typeof ResizeObserver === 'undefined') {
    return undefined;
  }
  const observer = new ResizeObserver(measure);
  observer.observe(avail);
  observer.observe(probe);
  return () => observer.disconnect();
};

const useStripFold = (signature: string) => {
  const availRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLDivElement>(null);
  const [folded, setFolded] = useState(false);

  useIsomorphicLayoutEffect(() => {
    const avail = availRef.current;
    const probe = probeRef.current;
    if (!avail || !probe) {
      return undefined;
    }
    return watchStrip(avail, probe, setFolded);
  }, [signature]);

  return { availRef, probeRef, folded };
};

export { useStripFold, stripOverflows };
