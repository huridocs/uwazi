import { MAIN_TAB } from '../../Tabs/tabIds.js';
import { PAGE_PARAM } from '../../urlParams.js';
import { scrollToPlaintextPage } from '../document/scrollToPlaintextPage.js';
import { useDocumentPdf } from '#V2/Routes/Entity/Components/context/index.js';
import type { useJumpToSearchHit } from './useJumpToSearchHit.js';

type PendingSnippet = { text: string; page: number };

const clearActiveSnippet = (args: {
  setActiveSnippet: (value: string | null) => void;
  setPendingSnippet: (value: PendingSnippet | null) => void;
  pdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
}) => {
  args.setActiveSnippet(null);
  args.setPendingSnippet(null);
  args.pdfController?.deactivateSnippet();
};

const applySnippetTarget = (args: {
  pageText: PendingSnippet;
  isRaw: boolean;
  setPendingSnippet: (value: PendingSnippet | null) => void;
  pdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
}) => {
  if (args.isRaw) {
    args.setPendingSnippet(null);
    scrollToPlaintextPage(args.pageText.page);
    return;
  }
  args.setPendingSnippet(args.pageText);
  args.pdfController?.goToPage(args.pageText.page);
};

const activateSearchSnippet = (args: {
  snippetKey: string;
  pageText: PendingSnippet;
  activeSnippet: string | null;
  isRaw: boolean;
  ensureMainTab: ReturnType<typeof useJumpToSearchHit>['ensureMainTab'];
  setActiveSnippet: (value: string | null) => void;
  setPendingSnippet: (value: PendingSnippet | null) => void;
  pdfController: ReturnType<typeof useDocumentPdf>['pdfController'];
}) => {
  const { snippetKey, pageText, activeSnippet, isRaw, ensureMainTab } = args;
  const { setActiveSnippet, setPendingSnippet, pdfController } = args;
  if (activeSnippet === snippetKey) {
    clearActiveSnippet({ setActiveSnippet, setPendingSnippet, pdfController });
    return;
  }
  setActiveSnippet(snippetKey);
  ensureMainTab(MAIN_TAB.DOCUMENT, {
    hash: next => {
      next.set(PAGE_PARAM, String(pageText.page));
    },
  });
  applySnippetTarget({ pageText, isRaw, setPendingSnippet, pdfController });
};

export { activateSearchSnippet };
export type { PendingSnippet };
