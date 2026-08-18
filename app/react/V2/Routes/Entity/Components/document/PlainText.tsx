import React, { useEffect, useMemo } from 'react';
import { scrollToPlaintextPage } from './scrollToPlaintextPage.js';

interface PlainTextProps {
  text: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
  page?: number;
}

const PAGE_SEPARATOR = '\f';

const splitPlaintextPages = (text: string): string[] => {
  if (!text) {
    return [];
  }
  if (text.includes(PAGE_SEPARATOR)) {
    return text.split(PAGE_SEPARATOR);
  }
  return [text];
};

export const PlainText = ({ className = '', dir, page, text }: PlainTextProps) => {
  const pages = useMemo(() => splitPlaintextPages(text), [text]);

  useEffect(() => {
    if (!page) {
      return;
    }
    scrollToPlaintextPage(page);
  }, [page, pages]);

  return (
    <div
      className={`${className} entity-plaintext-mono flex flex-col gap-4 p-4 text-sm leading-relaxed text-ink`}
      dir={dir}
      data-entity-plaintext=""
      data-testid="entity-plaintext"
    >
      {pages.map((pageText, index) => {
        const pageNumber = index + 1;
        return (
          <section
            key={pageNumber}
            id={`page${pageNumber}`}
            data-plaintext-page={pageNumber}
            aria-label={`Page ${pageNumber}`}
            className="entity-plaintext-mono whitespace-pre-line rounded-md border border-border-soft bg-paper p-4"
          >
            {pageText}
          </section>
        );
      })}
    </div>
  );
};

export type { PlainTextProps };
export { PAGE_SEPARATOR, splitPlaintextPages };
