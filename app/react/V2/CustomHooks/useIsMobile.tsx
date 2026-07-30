import { useState, useEffect } from 'react';
import { useAtomValue } from 'jotai';
import { isClient } from '#app/utils/index.js';
import { isMobileOverrideAtom, serverIsMobileAtom } from '#V2/atoms/isMobileAtom.js';

const MOBILE_VIEW_MAX_WIDTH = 768;

const useIsMobile = (maxWidth: number = MOBILE_VIEW_MAX_WIDTH) => {
  const override = useAtomValue(isMobileOverrideAtom);
  const serverInitialValue = useAtomValue(serverIsMobileAtom);

  const getInitialValue = () => {
    if (override !== undefined) {
      return override;
    }
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
    if (override !== undefined) {
      setIsMobile(override);
      return undefined;
    }

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
  }, [maxWidth, override]);

  return isMobile;
};

export { useIsMobile, MOBILE_VIEW_MAX_WIDTH };
