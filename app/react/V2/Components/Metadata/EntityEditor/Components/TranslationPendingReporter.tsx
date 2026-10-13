import { useEffect } from 'react';
import { useTranslationServiceAvailability } from './TranslationServiceAvailability.js';

const TranslationPendingReporter = ({
  onCount,
  onCancel,
}: {
  onCount: (count: number) => void;
  onCancel?: (cancel: () => void) => (() => void) | void;
}) => {
  const { subscribe, cancelTranslations } = useTranslationServiceAvailability();
  useEffect(() => subscribe(onCount), [onCount, subscribe]);
  useEffect(() => () => onCount(0), [onCount]);
  useEffect(() => {
    if (!onCancel) return undefined;
    return onCancel(() => {
      cancelTranslations();
      onCount(0);
    });
  }, [cancelTranslations, onCancel, onCount]);
  return null;
};

export { TranslationPendingReporter };
