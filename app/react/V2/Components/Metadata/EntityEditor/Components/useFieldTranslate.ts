import { useEffect, useRef, useState } from 'react';

const useFieldTranslate = ({
  onChange,
  onTranslate,
  disabled,
}: {
  onChange: (language: string, value: string) => void;
  onTranslate?: (language: string) => Promise<string>;
  disabled: boolean;
}) => {
  const [working, setWorking] = useState<string[]>([]);
  const [machine, setMachine] = useState<Record<string, boolean>>({});
  const cancelled = useRef(false);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    []
  );

  const translate = async (language: string) => {
    if (!onTranslate || disabled) return;
    setWorking(prev => (prev.includes(language) ? prev : [...prev, language]));
    try {
      const translated = await onTranslate(language);
      if (cancelled.current || !translated) return;
      onChange(language, translated);
      setMachine(prev => ({ ...prev, [language]: true }));
    } finally {
      if (!cancelled.current) {
        setWorking(prev => prev.filter(item => item !== language));
      }
    }
  };

  return {
    working,
    machine,
    translate,
    markUser: (language: string) => setMachine(prev => ({ ...prev, [language]: false })),
  };
};

export { useFieldTranslate };
