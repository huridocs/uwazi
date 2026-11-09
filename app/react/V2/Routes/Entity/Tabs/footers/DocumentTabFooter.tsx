import React, { type ReactNode } from 'react';
import { Translate } from '#app/I18N/index.js';
import { NeedAuthorization } from '#V2/Components/UI/index.js';
import type { FileType } from '#V2/api/entities/types.js';
import { OCRButton } from '#V2/Routes/Entity/Components/shared/index.js';
import { EntityTabFooter } from '../EntityTabFooter.js';
import { useDocumentPdfView } from '../hooks/useDocumentPdfView.js';

type DocumentTabFooterProps = {
  mainDocument: FileType;
  inset?: 'side' | 'main';
  trailing?: ReactNode;
  pageNavAlign?: 'start' | 'end';
};

const DocumentTabFooter = ({
  mainDocument,
  inset = 'main',
  trailing,
  pageNavAlign = 'end',
}: DocumentTabFooterProps) => {
  const { pageNumber, totalPages, nextPage, ocrServiceEnabled, isRaw, handlePageNavigation } =
    useDocumentPdfView({ mainDocument });
  const pageNav = isRaw ? null : (
    <div className="flex items-center gap-2 text-tab font-medium">
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
  );

  return (
    <EntityTabFooter inset={inset}>
      <div className={`flex w-full flex-row items-center gap-3${trailing ? ' flex-wrap' : ''}`}>
        {pageNavAlign === 'start' ? pageNav : null}
        <div className="grow justify-self-start">
          {ocrServiceEnabled && mainDocument ? (
            <NeedAuthorization roles={['admin', 'editor']}>
              <OCRButton file={mainDocument} />
            </NeedAuthorization>
          ) : null}
        </div>
        {pageNavAlign === 'end' ? pageNav : null}
        {trailing}
      </div>
    </EntityTabFooter>
  );
};

export { DocumentTabFooter };
