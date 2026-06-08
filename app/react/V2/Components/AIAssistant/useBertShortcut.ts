import { useEffect } from 'react';
import { useSetAtom } from 'jotai';
import { useAtomValue } from 'jotai';
import { aiAssistantOpenAtom } from '#V2/atoms/aiAssistantOpenAtom.js';
import { settingsAtom } from '#V2/atoms/settingsAtom.js';

const useBertShortcut = () => {
  const setOpen = useSetAtom(aiAssistantOpenAtom);
  const settings = useAtomValue(settingsAtom);
  const aiAssistantEnabled = settings.features?.aiAssistant ?? false;

  useEffect(() => {
    if (!aiAssistantEnabled) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'k') {
        return;
      }

      event.preventDefault();
      setOpen(previous => !previous);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aiAssistantEnabled, setOpen]);
};

export { useBertShortcut };
