import { useState, useLayoutEffect } from 'react';

function useContainerWidth<T extends HTMLElement>(containerRef: React.RefObject<T>): number {
  const [containerWidth, setWidth] = useState(0);

  useLayoutEffect(() => {
    const readWidth = () => {
      setWidth(containerRef.current?.offsetWidth || 0);
    };

    readWidth();

    window.addEventListener('resize', readWidth);
    return () => {
      window.removeEventListener('resize', readWidth);
    };
  }, []);

  return containerWidth;
}

export { useContainerWidth };
