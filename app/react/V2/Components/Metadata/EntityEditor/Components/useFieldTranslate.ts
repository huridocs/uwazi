import { useEffect, useRef, useState } from 'react';
import type { TranslationWriteOrigin } from './aiTranslatedText.js';
import { useTranslationServiceAvailability } from './TranslationServiceAvailability.js';

type TranslateToken = {
  language: string;
  started: number;
  sourceAtStart: number;
  cancelAtStart: number;
};

const nextSeq = (seq: Record<string, number>, language: string) => {
  const started = (seq[language] ?? 0) + 1;
  seq[language] = started;
  return started;
};

const isLive = (
  token: TranslateToken,
  ctx: { cancelled: boolean; seq: Record<string, number>; sourceGen: number; cancelGen: number }
) =>
  !ctx.cancelled &&
  ctx.seq[token.language] === token.started &&
  ctx.sourceGen === token.sourceAtStart &&
  ctx.cancelGen === token.cancelAtStart;

const applyIfLive = async ({
  token,
  onTranslate,
  onChange,
  cancelled,
  seq,
  sourceGen,
  cancelGen,
  signal,
}: {
  token: TranslateToken;
  onTranslate: (language: string, signal: AbortSignal) => Promise<string>;
  onChange: (language: string, value: string, origin?: TranslationWriteOrigin) => void;
  cancelled: { current: boolean };
  seq: { current: Record<string, number> };
  sourceGen: { current: number };
  cancelGen: { current: number };
  signal: AbortSignal;
}) => {
  const translated = await onTranslate(token.language, signal);
  if (
    !isLive(token, {
      cancelled: cancelled.current,
      seq: seq.current,
      sourceGen: sourceGen.current,
      cancelGen: cancelGen.current,
    }) ||
    !translated
  ) {
    return;
  }
  onChange(token.language, translated, 'translation');
};

const runTrackedTranslation = async ({
  token,
  onTranslate,
  onChange,
  cancelled,
  seq,
  sourceGen,
  cancelGen,
  track,
  begin,
  end,
  clearWorking,
}: {
  token: TranslateToken;
  onTranslate: (language: string, signal: AbortSignal) => Promise<string>;
  onChange: (language: string, value: string, origin?: TranslationWriteOrigin) => void;
  cancelled: { current: boolean };
  seq: { current: Record<string, number> };
  sourceGen: { current: number };
  cancelGen: { current: number };
  track: (controller: AbortController) => () => void;
  begin: () => void;
  end: () => void;
  clearWorking: (language: string) => void;
}) => {
  const controller = new AbortController();
  const release = track(controller);
  begin();
  try {
    await applyIfLive({
      token,
      onTranslate,
      onChange,
      cancelled,
      seq,
      sourceGen,
      cancelGen,
      signal: controller.signal,
    });
  } finally {
    release();
    if (cancelGen.current === token.cancelAtStart) {
      end();
      if (!cancelled.current && seq.current[token.language] === token.started) {
        clearWorking(token.language);
      }
    }
  }
};

const useSourceGeneration = (source: string) => {
  const sourceGen = useRef(0);
  const active = useRef(new Set<AbortController>());
  useEffect(() => {
    sourceGen.current += 1;
    active.current.forEach(controller => controller.abort());
  }, [source]);
  return { sourceGen, active };
};

const trackActiveController = (
  active: { current: Set<AbortController> },
  track: (controller: AbortController) => () => void,
  controller: AbortController
) => {
  active.current.add(controller);
  const release = track(controller);
  return () => {
    active.current.delete(controller);
    release();
  };
};

const useClearWorkingOnCancel = (
  cancelGeneration: number,
  setWorking: (languages: string[]) => void
) => {
  const seenCancel = useRef(cancelGeneration);
  useEffect(() => {
    if (seenCancel.current === cancelGeneration) return;
    seenCancel.current = cancelGeneration;
    setWorking([]);
  }, [cancelGeneration, setWorking]);
};

const useFieldTranslate = ({
  onChange,
  onTranslate,
  disabled,
  source,
}: {
  onChange: (language: string, value: string, origin?: TranslationWriteOrigin) => void;
  onTranslate?: (language: string, signal: AbortSignal) => Promise<string>;
  disabled: boolean;
  source: string;
}) => {
  const [working, setWorking] = useState<string[]>([]);
  const {
    beginTranslation,
    endTranslation,
    cancelGeneration,
    cancelGenerationRef,
    trackTranslation,
  } = useTranslationServiceAvailability();
  const cancelled = useRef(false);
  const seq = useRef<Record<string, number>>({});
  const { sourceGen, active } = useSourceGeneration(source);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    []
  );
  useClearWorkingOnCancel(cancelGeneration, setWorking);

  const translate = async (language: string) => {
    if (!onTranslate || disabled) return;
    setWorking(prev => (prev.includes(language) ? prev : [...prev, language]));
    await runTrackedTranslation({
      token: {
        language,
        started: nextSeq(seq.current, language),
        sourceAtStart: sourceGen.current,
        cancelAtStart: cancelGenerationRef.current,
      },
      onTranslate,
      onChange,
      cancelled,
      seq,
      sourceGen,
      cancelGen: cancelGenerationRef,
      track: controller => trackActiveController(active, trackTranslation, controller),
      begin: beginTranslation,
      end: endTranslation,
      clearWorking: item => setWorking(prev => prev.filter(entry => entry !== item)),
    });
  };

  return { working, translate };
};

export { useFieldTranslate };
