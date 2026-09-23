import { useEffect, useRef, useState } from 'react';

type TranslateToken = { language: string; started: number; sourceAtStart: number };

const nextSeq = (seq: Record<string, number>, language: string) => {
  const started = (seq[language] ?? 0) + 1;
  seq[language] = started;
  return started;
};

const isLive = (
  token: TranslateToken,
  ctx: { cancelled: boolean; seq: Record<string, number>; sourceGen: number }
) =>
  !ctx.cancelled &&
  ctx.seq[token.language] === token.started &&
  ctx.sourceGen === token.sourceAtStart;

const applyIfLive = async ({
  token,
  onTranslate,
  onChange,
  setMachine,
  cancelled,
  seq,
  sourceGen,
}: {
  token: TranslateToken;
  onTranslate: (language: string) => Promise<string>;
  onChange: (language: string, value: string) => void;
  setMachine: (update: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  cancelled: { current: boolean };
  seq: { current: Record<string, number> };
  sourceGen: { current: number };
}) => {
  const translated = await onTranslate(token.language);
  if (
    !isLive(token, {
      cancelled: cancelled.current,
      seq: seq.current,
      sourceGen: sourceGen.current,
    }) ||
    !translated
  ) {
    return;
  }
  onChange(token.language, translated);
  setMachine(prev => ({ ...prev, [token.language]: true }));
};

const useFieldTranslate = ({
  onChange,
  onTranslate,
  disabled,
  source,
}: {
  onChange: (language: string, value: string) => void;
  onTranslate?: (language: string) => Promise<string>;
  disabled: boolean;
  source: string;
}) => {
  const [working, setWorking] = useState<string[]>([]);
  const [machine, setMachine] = useState<Record<string, boolean>>({});
  const cancelled = useRef(false);
  const seq = useRef<Record<string, number>>({});
  const sourceGen = useRef(0);
  useEffect(
    () => () => {
      cancelled.current = true;
    },
    []
  );
  useEffect(() => {
    sourceGen.current += 1;
  }, [source]);

  const translate = async (language: string) => {
    if (!onTranslate || disabled) return;
    const token: TranslateToken = {
      language,
      started: nextSeq(seq.current, language),
      sourceAtStart: sourceGen.current,
    };
    setWorking(prev => (prev.includes(language) ? prev : [...prev, language]));
    try {
      await applyIfLive({
        token,
        onTranslate,
        onChange,
        setMachine,
        cancelled,
        seq,
        sourceGen,
      });
    } finally {
      if (!cancelled.current && seq.current[language] === token.started) {
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
