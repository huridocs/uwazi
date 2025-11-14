import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { isClient } from 'app/utils';
import { t, Translate } from 'app/I18N';
import { Entity } from 'V2/domain';
import { getPagePlaintext } from 'V2/api/files';
import { PDF } from 'V2/Components/PDFViewer';
import { TemplateLabel } from 'V2/Components/Metadata';
import { NeedAuthorization, Truncate } from 'V2/Components/UI';
import { settingsAtom } from 'V2/atoms';
import { PlainText } from './PlainText';
import { OCRButton } from './OCRButton';

// eslint-disable-next-line max-statements
const PDFView = ({ entity, pagePlaintext }: { entity: Entity; pagePlaintext?: string }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageText, setPageText] = useState(pagePlaintext || '');
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const firstLoad = useRef(true);

  const isRaw = !isClient || searchParams.get('raw') === 'true';
  const page = searchParams.get('page') || '1';

  const currentPage = Number.parseInt(page || '1', 10);
  const prevPage = Math.max(1, currentPage - 1);
  const nextPage = currentPage + 1;

  const onDisplayModeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const next = new URLSearchParams(searchParams.toString());
      if (value === 'raw') {
        next.set('raw', 'true');
      } else {
        next.delete('raw');
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  const onPageForward = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(nextPage));
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [nextPage, searchParams, setSearchParams]);

  const onPageBack = useCallback(() => {
    if (currentPage <= 1) return; // prevent going below page 1
    const next = new URLSearchParams(searchParams.toString());
    next.set('page', String(prevPage));
    setSearchParams(next, { replace: true, preventScrollReset: true });
  }, [currentPage, prevPage, searchParams, setSearchParams]);

  useEffect(() => {
    if (isRaw) {
      firstLoad.current = false;
    }

    if (isRaw && !firstLoad.current && entity.mainDocument) {
      getPagePlaintext(entity.mainDocument._id as string, currentPage)
        .then(text => setPageText(text as string))
        .catch(_e => {
          setPageText('');
        });
    }

    return () => {
      firstLoad.current = true;
    };
  }, [entity.mainDocument, isRaw, currentPage]);

  if (!entity?.mainDocument) {
    return <Translate>Loading</Translate>;
  }

  const { filename, originalname, totalPages } = entity.mainDocument;
  const prevParams = new URLSearchParams(searchParams.toString());
  prevParams.set('page', String(prevPage));
  const nextParams = new URLSearchParams(searchParams.toString());
  nextParams.set('page', String(Math.min(nextPage, totalPages!)));

  return (
    <div className="flex flex-col h-full gap-2 min-h-0">
      <div className="w-full p-4 rounded-md bg-gray-50">
        <div className="flex flex-row justify-between gap-2">
          <div>
            <TemplateLabel
              label={entity.template?.label || ''}
              templateId={entity.template?._id}
              color={entity.template?.color}
            />
          </div>
          <div>
            <label htmlFor="render-mode" className="sr-only">
              <Translate>View</Translate>
            </label>
            <select
              id="render-mode"
              className="bg-white rounded-md border-gr border-indigo-100 px-4 py-0 text-indigo-800"
              value={isRaw ? 'raw' : 'normal'}
              onChange={onDisplayModeChange}
            >
              <option value="raw">{t('System', 'Plain text', null, false)}</option>
              <option value="normal">{t('System', 'PDF', null, false)}</option>
            </select>
          </div>
        </div>
        <Truncate maxLength={80}>
          <h2 className="font-bold text-gray-900 mt-2 text-lg">{originalname}</h2>
        </Truncate>
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isRaw ? 'hidden' : 'block'}`}>
        {isClient && <PDF fileUrl={`/api/files/${filename}`} scrollToPage={page} />}
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isRaw ? 'block' : 'hidden'}`}>
        <PlainText text={pageText} />
      </div>
      <div className="flex flex-row">
        <div className="justify-self-start">
          {ocrServiceEnabled && entity.mainDocument && (
            <NeedAuthorization roles={['admin', 'editor']}>
              <OCRButton file={entity.mainDocument} />
            </NeedAuthorization>
          )}
        </div>
        <div className="justify-self-end flex items-center gap-2">
          <button
            type="button"
            onClick={onPageBack}
            disabled={currentPage <= 1}
            className="text-primary-700 disabled:text-gray-500"
          >
            <Translate>Previous page</Translate>
          </button>

          <button
            type="button"
            onClick={onPageForward}
            disabled={totalPages ? nextPage > totalPages : false}
            className="text-primary-700 disabled:text-gray-500"
          >
            <Translate>Next page</Translate>
          </button>

          <a href={`?${prevParams.toString()}`} rel="prev" className="sr-only">
            {t('System', 'Previous page', null, false)}
          </a>
          <a href={`?${nextParams.toString()}`} rel="next" className="sr-only">
            {t('System', 'Next page', null, false)}
          </a>
        </div>
      </div>
    </div>
  );
};

export { PDFView };
