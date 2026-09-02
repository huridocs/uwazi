import React, { useEffect, useState } from 'react';
import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { settingsAtom } from '#V2/atoms/index.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { readyDocuments } from '#shared/entityDefaultDocument.js';
import { getMainDocument } from '#V2/formatters/index.js';
import { getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { MetadataCard } from './MetadataCard.js';
import { specializedCardTitle } from './metadataFieldTitle.js';

type DocumentPreviewCardProps = {
  entity: Entity;
  previewField?: MetadataProperty;
  translationContext?: string;
};

type DocumentPreviewModelArgs = {
  entity: Entity;
  previewField?: MetadataProperty;
  defaultLanguage?: string;
  previewFailed: boolean;
  thumbFailed: boolean;
};

const isPdf = (mimetype?: string, filename?: string) => {
  const mime = mimetype || (filename ? getMimetypeFromUrl(filename) : '');
  return mime === 'application/pdf' || /\.pdf$/i.test(filename || '');
};

const previewSrcOf = (previewField?: MetadataProperty) =>
  previewField && (previewField.type === 'preview' || previewField.type === 'image')
    ? previewField.values?.find(value => Boolean(value.value))?.value
    : undefined;

const documentFileUrls = (document: ReturnType<typeof getMainDocument>) => {
  const name = document?.originalname || document?.filename;
  const fileUrl = document?.filename
    ? `/api/files/${document.filename}`
    : document?.url || undefined;
  return {
    name,
    fileUrl,
    downloadUrl: document?.filename && fileUrl ? `${fileUrl}?download=true` : fileUrl,
    hasFilename: Boolean(document?.filename),
    documentId: document?._id ? String(document._id) : document?.filename,
    showPdfBadge: isPdf(document?.mimetype, document?.filename || document?.originalname),
  };
};

const buildDocumentPreviewModel = ({
  entity,
  previewField,
  defaultLanguage,
  previewFailed,
  thumbFailed,
}: DocumentPreviewModelArgs) => {
  const document = getMainDocument(
    readyDocuments(entity.documents),
    entity.language,
    defaultLanguage
  );
  const previewSrc = previewSrcOf(previewField);
  if (!document && !previewSrc) {
    return null;
  }
  const urls = documentFileUrls(document);
  const activePreviewSrc = previewSrc && !previewFailed ? previewSrc : undefined;
  const fileThumbSrc =
    document?._id && !thumbFailed ? `/api/files/${String(document._id)}.jpg` : undefined;
  return {
    ...urls,
    thumbSrc: activePreviewSrc || fileThumbSrc,
    activePreviewSrc,
  };
};

const DocumentPreviewCard = ({
  entity,
  previewField,
  translationContext = '',
}: DocumentPreviewCardProps) => {
  const settings = useAtomValue(settingsAtom);
  const defaultLanguage = settings?.languages?.find(language => language.default)?.key;
  const [previewFailed, setPreviewFailed] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const model = buildDocumentPreviewModel({
    entity,
    previewField,
    defaultLanguage,
    previewFailed,
    thumbFailed,
  });

  useEffect(() => {
    setPreviewFailed(false);
    setThumbFailed(false);
  }, [previewField, entity._id, entity.sharedId, entity.language, model?.documentId]);

  if (!model) {
    return null;
  }

  const title = previewField ? specializedCardTitle(previewField, translationContext) : undefined;

  return (
    <MetadataCard title={title}>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
        <div className="relative min-h-32 w-full flex-1 overflow-hidden rounded-md bg-(--color-theme-surface-warm)">
          {model.thumbSrc ? (
            <img
              src={model.thumbSrc}
              alt={model.name || ''}
              className="absolute inset-0 h-full w-full object-contain"
              onError={() => {
                if (model.activePreviewSrc) {
                  setPreviewFailed(true);
                  return;
                }
                setThumbFailed(true);
              }}
            />
          ) : null}
          {model.showPdfBadge ? (
            <Translate
              key="pdf-badge"
              className="absolute bottom-1 inset-e-1 rounded-xs bg-ink px-1 py-px text-pico font-semibold uppercase leading-none tracking-wider text-parchment"
            >
              PDF
            </Translate>
          ) : null}
        </div>
        {model.fileUrl ? (
          <div className="flex shrink-0 items-center gap-2">
            <a
              href={model.fileUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
            >
              <EyeIcon className="h-nano w-nano text-ink-tertiary" />
              <Translate>View</Translate>
            </a>
            {model.downloadUrl ? (
              <a
                href={model.downloadUrl}
                download={model.hasFilename}
                className="inline-flex items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
              >
                <ArrowDownTrayIcon className="h-nano w-nano text-ink-tertiary" />
                <Translate>Download</Translate>
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </MetadataCard>
  );
};

export { DocumentPreviewCard };
