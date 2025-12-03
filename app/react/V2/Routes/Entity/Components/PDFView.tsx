import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useAtomValue } from 'jotai';
import { t, Translate } from 'app/I18N';
import { Entity } from 'V2/domain';
import { getPagePlaintext } from 'V2/api/files';
import { PDF, pdfEventBus } from 'V2/Components/PDFViewer';
import { TemplateLabel } from 'V2/Components/Metadata';
import { NeedAuthorization, Truncate } from 'V2/Components/UI';
import { settingsAtom } from 'V2/atoms';
import { PlainText } from './PlainText';
import { OCRButton } from './OCRButton';
import { PAGE_PARAM, VIEW_MODE_PARAM } from '../urlParams';
import { scrollToPage } from './functions';

// eslint-disable-next-line max-statements
const PDFView = ({ entity, pagePlaintext }: { entity: Entity; pagePlaintext?: string }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const isRaw = searchParams.get(VIEW_MODE_PARAM) === 'true';
  const page = searchParams.get(PAGE_PARAM) || '1';
  const pageNumber = Number.parseInt(page || '1', 10);
  const { ocrServiceEnabled } = useAtomValue(settingsAtom);
  const [firstRender, setFirstRender] = useState(true);
  const [pageText, setPageText] = useState(pagePlaintext || '');

  const getPageSearchParams = useCallback(
    (pageParam: number | string) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set(PAGE_PARAM, String(pageParam));
      return next;
    },
    [searchParams]
  );

  const updatePageParam = useCallback(
    (pageParam: number | string) => {
      setSearchParams(getPageSearchParams(pageParam), { replace: true, preventScrollReset: true });
    },
    [getPageSearchParams, setSearchParams]
  );

  const onDisplayModeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const { value } = event.target;
      const next = new URLSearchParams(searchParams.toString());
      if (value === VIEW_MODE_PARAM) {
        next.set(VIEW_MODE_PARAM, 'true');
      } else {
        const currentPage = searchParams.get(PAGE_PARAM) || '1';
        next.delete(VIEW_MODE_PARAM);
        next.set(PAGE_PARAM, currentPage);
      }
      setSearchParams(next, { replace: true, preventScrollReset: true });
    },
    [searchParams, setSearchParams]
  );

  useEffect(() => {
    setFirstRender(false);

    return () => {
      setFirstRender(true);
    };
  }, []);

  useEffect(() => {
    if (!firstRender && isRaw) {
      if (entity.mainDocument?._id) {
        getPagePlaintext(entity.mainDocument._id as string, pageNumber)
          .then(text => setPageText(text as string))
          .catch(() => setPageText(''));
      }
    }
  }, [pageNumber, entity, firstRender, isRaw]);

  useEffect(() => {
    const handlePageChange = (p?: number) => {
      updatePageParam(p || 1);
    };

    const { unsubscribe } = pdfEventBus.on('onPageChange', handlePageChange);

    return () => {
      unsubscribe();
    };
  }, [updatePageParam]);

  if (!entity?.mainDocument) {
    return <Translate>Loading</Translate>;
  }

  const { filename, originalname, totalPages } = entity.mainDocument;
  const prevPage = Math.max(1, pageNumber - 1);
  const nextPage = Math.min(pageNumber + 1, totalPages || 0);

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
      <div
        className={`flex-1 min-h-0 overflow-y-auto ${firstRender || isRaw ? 'hidden' : 'block'}`}
      >
        <PDF fileUrl={`/api/files/${filename}`} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isRaw ? 'block' : 'hidden'}`}>
        <PlainText text={pageText} />
      </div>
      <div className="flex flex-row">
        <div className="justify-self-start grow">
          {ocrServiceEnabled && entity.mainDocument && (
            <NeedAuthorization roles={['admin', 'editor']}>
              <OCRButton file={entity.mainDocument} />
            </NeedAuthorization>
          )}
        </div>
        <div className="justify-self-end flex items-center gap-2 font-medium">
          <button
            type="button"
            onClick={() => {
              if (isRaw) {
                updatePageParam(prevPage);
              } else {
                scrollToPage(prevPage);
              }
            }}
            disabled={pageNumber <= 1}
            className="text-primary-700 disabled:text-gray-500"
          >
            <Translate>Previous</Translate>
          </button>
          <div className="text-primary-900">
            {pageNumber} / {totalPages}
          </div>
          <button
            type="button"
            onClick={() => {
              if (isRaw) {
                updatePageParam(nextPage);
              } else {
                scrollToPage(nextPage);
              }
            }}
            disabled={totalPages ? nextPage > totalPages : false}
            className="text-primary-700 disabled:text-gray-500"
          >
            <Translate>Next</Translate>
          </button>
        </div>
        <div className="sr-only">
          <a href={`?${getPageSearchParams(prevPage).toString()}`} rel="prev">
            {t('System', 'Previous', null, false)}
          </a>
          <a href={`?${getPageSearchParams(nextPage).toString()}`} rel="next">
            {t('System', 'Next', null, false)}
          </a>
        </div>
      </div>
    </div>
  );
};

export { PDFView };
