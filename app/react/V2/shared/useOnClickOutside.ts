import { RefObject, useEffect } from 'react';

export const useOnClickOutside = <T extends HTMLElement>(
  ref: RefObject<T>,
  callback: (event: MouseEvent) => void
) => {
  useEffect(() => {
    const onClickHandler = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as HTMLElement)) {
        return;
      }

      callback(event);
    };

    document.addEventListener('click', onClickHandler);
    return () => {
      document.removeEventListener('click', onClickHandler);
    };
  }, [ref, callback]);
};
