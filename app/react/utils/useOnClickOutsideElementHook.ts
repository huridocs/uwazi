import { RefObject, useEffect } from 'react';

export function useOnClickOutsideElement<T extends HTMLElement>(
  ref: RefObject<T>,
  cb: (event: MouseEvent) => void
) {
  useEffect(() => {
    const onClickHandler = (event: MouseEvent) => {
      if (!ref.current || ref.current.contains(event.target as HTMLElement)) {
        return;
      }

      cb(event);
    };

    document.addEventListener('click', onClickHandler, { capture: true });
    return () => {
      document.removeEventListener('click', onClickHandler);
    };
  }, [ref, cb]);
}
