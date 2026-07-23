import React from 'react';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { OCRButton } from '#V2/Routes/Entity/Components/shared/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';

type DocumentTabFooterProps = {
  mainDocument: FileType;
};

const DocumentTabFooter = ({ mainDocument }: DocumentTabFooterProps) => {
  const { pageNumber, totalPages, nextPage, ocrServiceEnabled, isRaw, handlePageNavigation } =
    useDocumentPdfView({ mainDocument });

  return (
    <EntityTabFooter>
      <div className="flex w-full flex-row items-center gap-3">
        <div className="grow justify-self-start">
          {ocrServiceEnabled && mainDocument ? (
            <NeedAuthorization roles={['admin', 'editor']}>
              <OCRButton file={mainDocument} />
            </NeedAuthorization>
          ) : null}
        </div>
        {!isRaw ? (
          <div className="flex items-center gap-2 justify-self-end text-tab font-medium">
            <button
              type="button"
              onClick={() => handlePageNavigation('prev')}
              disabled={pageNumber <= 1}
              className="text-ink hover:text-ink-secondary disabled:text-ink-muted disabled:hover:text-ink-muted"
            >
              <Translate>Previous</Translate>
            </button>
            <div className="rounded bg-warm px-2 py-1 text-ink">
              {pageNumber} / {totalPages}
            </div>
            <button
              type="button"
              onClick={() => handlePageNavigation('next')}
              disabled={totalPages ? nextPage > totalPages : false}
              className="text-ink hover:text-ink-secondary disabled:text-ink-muted disabled:hover:text-ink-muted"
            >
              <Translate>Next</Translate>
            </button>
          </div>
        ) : null}
      </div>
    </EntityTabFooter>
  );
};

export { DocumentTabFooter };
