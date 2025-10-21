import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { isClient } from 'app/utils';
import { serverIsMobileAtom } from 'V2/atoms/isMobileAtom';

const MOBILE_VIEW_MAX_WIDTH = 768;

const useIsMobile = (maxWidth: number = MOBILE_VIEW_MAX_WIDTH) => {
  const serverInitialValue = useAtomValue(serverIsMobileAtom);

  // Use server-provided value as initial state if available
  const getInitialValue = () => {
    if (serverInitialValue !== undefined) {
      return serverInitialValue;
    }
    if (isClient) {
      return window.innerWidth <= maxWidth;
    }
    return undefined;
  };

  const [isMobile, setIsMobile] = useState<boolean | undefined>(getInitialValue);

  useEffect(() => {
    let maxWidthObserver: MediaQueryList;

    const onChange = () => {
      setIsMobile(window.innerWidth <= maxWidth);
    };

    if (isClient) {
      maxWidthObserver = window.matchMedia(`(max-width: ${maxWidth - 1}px)`);

      maxWidthObserver.addEventListener('change', onChange);

      setIsMobile(window.innerWidth <= maxWidth);
    }

    return () => {
      if (maxWidthObserver) {
        maxWidthObserver.removeEventListener('change', onChange);
      }
    };
  }, [maxWidth]);

  return isMobile;
};

export { useIsMobile, MOBILE_VIEW_MAX_WIDTH };
