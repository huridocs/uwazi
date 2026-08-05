import React, { useMemo } from 'react';

interface PlainTextProps {
  text: string;
  className?: string;
  dir?: 'ltr' | 'rtl';
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

export const PlainText = ({ className = '', dir, text }: PlainTextProps) => {
  const pages = useMemo(() => splitPlaintextPages(text), [text]);

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
            aria-label={`Page ${pageNumber}`}
            className="entity-plaintext-mono whitespace-pre-line"
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
