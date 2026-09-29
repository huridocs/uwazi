import { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { DEFAULT_DEBOUNCE_MS } from './useDebouncedDraft.js';

const useIdleFormValue = (name: string, delay = DEFAULT_DEBOUNCE_MS) => {
  const { getValues, watch } = useFormContext();
  const [value, setValue] = useState(() => String(getValues(name) ?? ''));

  useEffect(() => {
    let timer: number | undefined;
    const apply = (next: string) => {
      setValue(prev => (prev === next ? prev : next));
    };
    const { unsubscribe } = watch((_formValues, info) => {
      if (info.name && info.name !== name && !info.name.startsWith(`${name}.`)) return;
      const next = String(getValues(name) ?? '');
      if (!info.name) {
        apply(next);
        return;
      }
      window.clearTimeout(timer);
      timer = window.setTimeout(() => apply(next), delay);
    });
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [delay, getValues, name, watch]);

  return value;
};

export { useIdleFormValue };
