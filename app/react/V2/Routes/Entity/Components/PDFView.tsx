import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { FileType } from 'shared/types/fileType';
import { Translate } from 'app/I18N';
import { PDF, PlainText } from 'V2/Components/PDFViewer';
import { Entity } from 'V2/domain';
import { TemplateLabel } from 'V2/Components/Metadata';
import { Truncate } from 'V2/Components/UI';

const PDFView = ({ entity, mainDocumentFile }: { entity: Entity; mainDocumentFile?: FileType }) => {
  const [searchParams, setSearchParams] = useSearchParams();

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

  if (!entity?.mainDocument) {
    return <Translate>Loading</Translate>;
  }

  const { filename, originalname } = entity.mainDocument;

  const isRaw = searchParams.get('raw') === 'true';
  const pageParam = searchParams.get('page') || undefined;

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
              <option value="raw">
                <Translate>Plain text</Translate>
              </option>
              <option value="normal">
                <Translate>Normal view</Translate>
              </option>
            </select>
          </div>
        </div>
        <Truncate maxLength={80}>
          <h2 className="font-bold text-gray-900 mt-2 text-lg">{originalname}</h2>
        </Truncate>
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isRaw ? 'hidden' : 'block'}`}>
        <PDF fileUrl={`/api/files/${filename}`} scrollToPage={pageParam} />
      </div>
      <div className={`flex-1 min-h-0 overflow-y-auto ${isRaw ? 'block' : 'hidden'}`}>
        <PlainText file={mainDocumentFile} page={pageParam} />
      </div>
      <div>footer</div>
    </div>
  );
};

export { PDFView };
