/**
 * @jest-environment jsdom
 */
import React, { type ReactNode } from 'react';
import { renderHook } from '@testing-library/react';
import {
  DocumentHighlightGateContext,
  useDocumentHighlightGate,
  useDocumentHighlightPaint,
  useRegisterDocumentHighlight,
} from '../documentHighlightGate.js';

const Gate = ({ children }: { children: ReactNode }) => {
  const gate = useDocumentHighlightGate();
  return (
    <DocumentHighlightGateContext.Provider value={gate}>
      {children}
    </DocumentHighlightGateContext.Provider>
  );
};

describe('document highlight gate', () => {
  it('paints every jump that was waiting for the document', () => {
    const { result } = renderHook(
      () => ({ paint: useDocumentHighlightPaint(), register: useRegisterDocumentHighlight() }),
      { wrapper: Gate }
    );
    const painted: string[] = [];
    result.current.register?.('library-document', false);
    result.current.paint(() => painted.push('first'));
    result.current.paint(() => painted.push('second'));
    expect(painted).toEqual([]);
    result.current.register?.('library-document', true);
    expect(painted).toEqual(['first', 'second']);
  });
});
