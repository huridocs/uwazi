import React from 'react';
import { FileType } from 'shared/types/fileType';

interface PlainTextProps {
  file?: FileType;
  page?: number | string;
  className?: string;
  dir?: 'ltr' | 'rtl';
}

export const PlainText = ({ className = '', dir, page, file }: PlainTextProps) => {
  const firstPage = file?.fullText
    ? Object.keys(file.fullText)
        .map(k => Number(k))
        .filter(n => !Number.isNaN(n))
        .sort((a, b) => a - b)[0]
    : 1;

  const pageKey = page ? String(page) : String(firstPage);

  const pageText = file?.fullText?.[pageKey] ?? '';

  return (
    <div className={`${className} whitespace-pre-line`} dir={dir}>
      {pageText}
    </div>
  );
};

export type { PlainTextProps };
