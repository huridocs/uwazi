/**
 * @jest-environment jsdom
 */
import { renderHook } from '@testing-library/react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import type { TocState } from '#V2/Routes/Entity/Components/context/types.js';
import type { ProcessedTocEntry } from '../types.js';
import { useToCPanelHandlers } from '../useToCPanelHandlers.js';

const entry: ProcessedTocEntry = {
  entry: {
    label: 'Introduction',
    indentation: 0,
    selectionRectangles: [{ top: 0, left: 0, width: 1, height: 1, page: '2' }],
  },
  index: 0,
  originalIndex: 0,
  indentation: 0,
  topIndex: 0,
  isTopLevel: true,
};

const tocState: TocState = {
  toc: [entry.entry],
  isEditMode: false,
  expanded: {},
  isAllExpanded: false,
  isAllCollapsed: true,
  isSaving: false,
};

const pdf = (): PDFControls => ({
  goToPage: jest.fn(),
  scrollToHighlight: jest.fn(),
  activateSnippet: jest.fn(),
  deactivateSnippet: jest.fn(),
  toggleHighlights: jest.fn(),
});

const handlers = (onRevealDocument?: () => void) => {
  const controller = pdf();
  const hook = renderHook(() =>
    useToCPanelHandlers({
      toc: [entry.entry],
      tocState,
      setToc: () => undefined,
      setEditMode: () => undefined,
      updateEntry: () => undefined,
      deleteEntry: () => undefined,
      setTocState: () => undefined,
      mainPdfController: controller,
      onRevealDocument,
      revalidate: () => Promise.resolve(),
      notify: () => undefined,
    })
  );
  return { controller, result: hook.result };
};

describe('useToCPanelHandlers', () => {
  it('jumps to the entry page', () => {
    const { controller, result } = handlers();
    result.current.handleToCEntryClick(entry);
    expect(controller.goToPage).toHaveBeenCalledWith(2);
  });

  it('highlights the entry anchor once the document can paint', () => {
    const controller = pdf();
    let queued: (() => void) | undefined;
    const hook = renderHook(() =>
      useToCPanelHandlers({
        toc: [entry.entry],
        tocState,
        setToc: () => undefined,
        setEditMode: () => undefined,
        updateEntry: () => undefined,
        deleteEntry: () => undefined,
        setTocState: () => undefined,
        mainPdfController: controller,
        revalidate: () => Promise.resolve(),
        notify: () => undefined,
        paintHighlight: run => {
          queued = run;
        },
      })
    );
    hook.result.current.handleToCEntryClick(entry);
    expect(controller.goToPage).toHaveBeenCalledWith(2);
    expect(controller.toggleHighlights).not.toHaveBeenCalled();
    queued?.();
    expect(controller.toggleHighlights).toHaveBeenCalledWith([
      expect.objectContaining({
        2: [
          expect.objectContaining({
            color: '#ffd84b',
            textSelection: expect.objectContaining({
              selectionRectangles: [expect.objectContaining({ regionId: '2', top: 0, left: 0 })],
            }),
          }),
        ],
      }),
    ]);
  });

  it('jumps to the entry page and reveals the document in the library', () => {
    const reveal = jest.fn();
    const { controller, result } = handlers(reveal);
    result.current.handleToCEntryClick(entry);
    expect(controller.goToPage).toHaveBeenCalledWith(2);
    expect(reveal).toHaveBeenCalledTimes(1);
  });
});
