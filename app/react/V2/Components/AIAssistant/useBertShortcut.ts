import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { aiAssistantOpenAtom } from '#V2/atoms/aiAssistantOpenAtom.js';

const useBertShortcut = () => {
  const setOpen = useSetAtom(aiAssistantOpenAtom);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') {
        return;
      }

      event.preventDefault();
      setOpen(previous => !previous);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setOpen]);
};

export { useBertShortcut };
