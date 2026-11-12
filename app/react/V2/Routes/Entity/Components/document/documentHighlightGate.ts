import { createContext, useContext, useState } from 'react';

type PaintDocumentHighlight = (run: () => void) => void;

type DocumentHighlightGate = {
  register: (id: string, ready: boolean | null) => void;
  paint: PaintDocumentHighlight;
};

const paintDocumentHighlightNow: PaintDocumentHighlight = run => {
  run();
};

const createDocumentHighlightGate = (): DocumentHighlightGate => {
  const viewers = new Map<string, boolean>();
  let pending: (() => void)[] = [];
  const canPaint = () => viewers.size === 0 || [...viewers.values()].some(Boolean);
  const flush = () => {
    if (!canPaint() || pending.length === 0) return;
    const queued = pending;
    pending = [];
    queued.forEach(run => run());
  };
  return {
    register: (id, ready) => {
      if (ready === null) {
        viewers.delete(id);
        return;
      }
      viewers.set(id, ready);
      flush();
    },
    paint: run => {
      if (canPaint()) {
        run();
        return;
      }
      pending.push(run);
    },
  };
};

const DocumentHighlightGateContext = createContext<DocumentHighlightGate | null>(null);

const useDocumentHighlightGate = () => useState(createDocumentHighlightGate)[0];

const useDocumentHighlightPaint = (): PaintDocumentHighlight =>
  useContext(DocumentHighlightGateContext)?.paint ?? paintDocumentHighlightNow;

const useRegisterDocumentHighlight = () => useContext(DocumentHighlightGateContext)?.register;

export {
  DocumentHighlightGateContext,
  paintDocumentHighlightNow,
  useDocumentHighlightGate,
  useDocumentHighlightPaint,
  useRegisterDocumentHighlight,
};
export type { DocumentHighlightGate, PaintDocumentHighlight };
