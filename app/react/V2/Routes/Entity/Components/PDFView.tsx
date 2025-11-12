import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { isClient } from 'app/utils';
import { t, Translate } from 'app/I18N';
import { Entity } from 'V2/domain';
import { getPagePlaintext } from 'V2/api/files';
import { PDF } from 'V2/Components/PDFViewer';
import { TemplateLabel } from 'V2/Components/Metadata';
import { Truncate } from 'V2/Components/UI';
import { PlainText } from './PlainText';

const PDFView = ({
  entity,
  pagePlaintext,
  page,
}: {
  entity: Entity;
  page: string;
  pagePlaintext?: string;
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [pageText, setPageText] = useState(pagePlaintext || '');
  const firstLoad = useRef(true);

  const isRaw = !isClient || searchParams.get('raw') === 'true';

  const onSelect = useCallback(
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

  useEffect(() => {
    if (isRaw && !firstLoad && entity.mainDocument) {
      getPagePlaintext(entity.mainDocument._id as string, Number.parseInt(page || '1', 10))
        .then(text => setPageText(text))
        .catch(_e => {
          setPageText('');
        });
    } else {
      firstLoad.current = false;
    }

    return () => {
      firstLoad.current = true;
    };
  }, [entity.mainDocument, isRaw, page]);

  if (!entity?.mainDocument) {
    return <Translate>Loading</Translate>;
  }

  const { filename, originalname } = entity.mainDocument;

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
              onChange={onSelect}
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
      <div>footer</div>
    </div>
  );
};

export { PDFView };
