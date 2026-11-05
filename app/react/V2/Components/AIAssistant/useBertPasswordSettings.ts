import { useCallback, useEffect, useRef, useState } from 'react';
import { getSettings } from '#V2/api/aiAssistant/settings.js';
import {
  getBertSessionPassword,
  hasBertSessionPassword,
  setBertSessionPassword,
} from './bertSessionPassword.js';

const useBertPasswordSettings = (mockReplies: boolean) => {
  const [requiresPassword, setRequiresPassword] = useState(!mockReplies);
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(
    () => mockReplies || hasBertSessionPassword()
  );
  const passwordRef = useRef<string | null>(getBertSessionPassword());

  useEffect(() => {
    if (mockReplies) {
      return undefined;
    }

    let cancelled = false;
    const load = async () => {
      const [settings] = await getSettings();
      if (cancelled || !settings) {
        return;
      }
      setRequiresPassword(settings.requiresPassword);
      if (!settings.requiresPassword) {
        setIsPasswordUnlocked(true);
      }
    };

    load().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [mockReplies]);

  const unlockWithPassword = useCallback((password: string) => {
    passwordRef.current = password;
    setBertSessionPassword(password);
    setIsPasswordUnlocked(true);
  }, []);

  return {
    requiresPassword,
    isPasswordUnlocked,
    passwordRef,
    unlockWithPassword,
  };
};

export { useBertPasswordSettings };
