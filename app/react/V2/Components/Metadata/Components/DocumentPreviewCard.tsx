/* eslint-disable react/no-multi-comp */
import React, { useState } from 'react';
import { ArrowDownTrayIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useAtomValue } from 'jotai';
import { Translate } from '#app/I18N/index.js';
import { localeAtom } from '#V2/atoms/translationsAtoms.js';
import type { Entity } from '#V2/api/entities/types.js';
import type { MetadataProperty } from '#V2/formatters/types.js';
import { getMainDocument } from '#V2/formatters/index.js';
import {
  formatMetadataTimestamp,
  metadataDisplayPresets,
} from '#V2/Components/Metadata/display/index.js';
import { formatBytes, getMimetypeFromUrl } from '#V2/shared/formatHelpers.js';
import { MetadataCard } from './MetadataCard.js';

type DocumentPreviewCardProps = {
  entity: Entity;
  previewField?: MetadataProperty;
};

type FactItem = { label: string; value: string; ltr?: boolean };

const Fact = ({ label, value, ltr }: FactItem) => (
  <div className="min-w-0 space-y-0.5">
    <p className="text-nano font-medium uppercase tracking-wide text-ink-tertiary">
      <Translate>{label}</Translate>
    </p>
    <p className="truncate text-sm text-ink" dir={ltr ? 'ltr' : undefined} title={value}>
      {value}
    </p>
  </div>
);

const typeLabelFromMime = (mimetype?: string, filename?: string): string | undefined => {
  const mime = mimetype || (filename ? getMimetypeFromUrl(filename) : '');
  if (!mime) return undefined;
  const parts = mime.split('/');
  return (parts[parts.length - 1] || mime).toUpperCase();
};

const isPdf = (mimetype?: string, filename?: string) => {
  const mime = mimetype || (filename ? getMimetypeFromUrl(filename) : '');
  return mime === 'application/pdf' || /\.pdf$/i.test(filename || '');
};

const DocumentPreviewCard = ({ entity, previewField }: DocumentPreviewCardProps) => {
  const locale = useAtomValue(localeAtom);
  const [thumbFailed, setThumbFailed] = useState(false);
  const document = getMainDocument(entity.documents, entity.language);
  const previewValues =
    previewField && (previewField.type === 'preview' || previewField.type === 'image')
      ? previewField.values
      : undefined;
  const previewSrc = previewValues?.find(value => Boolean(value.value))?.value;
  const hasPreview = Boolean(previewSrc);

  if (!document && !hasPreview) {
    return null;
  }

  const name = document?.originalname || document?.filename;
  const type = typeLabelFromMime(document?.mimetype, document?.filename || document?.originalname);
  const size =
    typeof document?.size === 'number' && document.size > 0
      ? formatBytes(document.size)
      : undefined;
  const displayContext = { ...metadataDisplayPresets.rich, locale };
  const added =
    typeof document?.creationDate === 'number'
      ? formatMetadataTimestamp(document.creationDate, displayContext)
      : undefined;
  const fileUrl = document?.filename
    ? `/api/files/${document.filename}`
    : document?.url || undefined;
  const downloadUrl = document?.filename && fileUrl ? `${fileUrl}?download=true` : fileUrl;
  const fileThumbSrc =
    document?._id && !thumbFailed ? `/api/files/${String(document._id)}.jpg` : undefined;
  const thumbSrc = previewSrc || fileThumbSrc;
  const showPdfBadge = isPdf(document?.mimetype, document?.filename || document?.originalname);

  const facts: FactItem[] = [
    ...(type ? [{ label: 'Type', value: type }] : []),
    ...(size ? [{ label: 'Size', value: size, ltr: true }] : []),
    ...(added ? [{ label: 'Last Edited', value: added, ltr: true }] : []),
    ...(added ? [{ label: 'Added', value: added, ltr: true }] : []),
  ];

  return (
    <MetadataCard title={<Translate>Document</Translate>}>
      <div className="flex items-start gap-4">
        <div className="group relative h-[118px] w-[104px] shrink-0 overflow-hidden rounded border border-border bg-vellum">
          <div className="absolute inset-x-[16%] top-[10%] -bottom-[15%] overflow-hidden rounded-t-[3px] border border-border-soft bg-paper shadow-sm">
            {thumbSrc ? (
              <img
                src={thumbSrc}
                alt={name || ''}
                className="h-full w-full object-cover object-top"
                onError={() => {
                  if (!previewSrc) setThumbFailed(true);
                }}
              />
            ) : null}
          </div>
          {showPdfBadge ? (
            <span className="absolute bottom-1 end-1 rounded-[2px] bg-ink/70 px-1 py-px text-pico font-semibold uppercase leading-none tracking-wider text-parchment">
              PDF
            </span>
          ) : null}
        </div>
        <div className="min-w-0 flex flex-1 flex-col gap-3">
          {name ? <Fact label="Name" value={name} /> : null}
          {facts.length > 0 ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
              {facts.map(fact => (
                <Fact key={fact.label} label={fact.label} value={fact.value} ltr={fact.ltr} />
              ))}
            </div>
          ) : null}
        </div>
      </div>
      {fileUrl ? (
        <div className="flex items-center gap-2 pt-1">
          <a
            href={fileUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
          >
            <EyeIcon className="h-nano w-nano text-ink-tertiary" />
            <Translate>View</Translate>
          </a>
          {downloadUrl ? (
            <a
              href={downloadUrl}
              download={Boolean(document?.filename)}
              className="inline-flex items-center gap-1.5 rounded-md bg-warm px-3 py-1.5 text-xs font-medium text-ink-secondary transition-colors hover:bg-parchment hover:text-ink"
            >
              <ArrowDownTrayIcon className="h-nano w-nano text-ink-tertiary" />
              <Translate>Download</Translate>
            </a>
          ) : null}
        </div>
      ) : null}
    </MetadataCard>
  );
};

export { DocumentPreviewCard };
