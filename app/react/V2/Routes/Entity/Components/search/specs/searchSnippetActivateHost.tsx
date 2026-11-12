import React from 'react';
import type { PDFControls } from '#V2/Components/PDFViewer/index.js';
import { useJumpToSearchHit } from '../useJumpToSearchHit.js';
import { activateSearchSnippet } from '../searchSnippetActivate.js';

const SearchSnippetActions = ({ controller }: { controller: PDFControls }) => {
  const jump = useJumpToSearchHit();
  return (
    <>
      <button type="button" onClick={() => jump.jumpToProperty('metadata.region.value')}>
        property
      </button>
      <button
        type="button"
        onClick={() =>
          activateSearchSnippet({
            snippetKey: 'doc-1',
            pageText: { text: 'court', page: 4 },
            activeSnippet: null,
            isRaw: false,
            ensureMainTab: jump.ensureMainTab,
            setActiveSnippet: () => undefined,
            setPendingSnippet: () => undefined,
            pdfController: controller,
          })
        }
      >
        document
      </button>
    </>
  );
};

export { SearchSnippetActions };
