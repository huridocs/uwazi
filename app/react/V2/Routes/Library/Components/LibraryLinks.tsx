import React from 'react';
import type { LibraryLink } from './libraryTableCellValue.js';

type LibraryLinksProps = {
  links: LibraryLink[];
  className?: string;
};

const LibraryLinks = ({ links, className = '' }: LibraryLinksProps) => (
  <span
    title={links.map(link => link.label).join(', ')}
    className={`min-w-0 truncate text-ink ${className}`}
  >
    {links.map((link, index) => (
      <React.Fragment key={`${link.href}-${link.label}`}>
        {index > 0 ? ', ' : null}
        <a
          href={link.href}
          target="_blank"
          rel="noreferrer"
          className="underline"
          onClick={event => event.stopPropagation()}
        >
          {link.label}
        </a>
      </React.Fragment>
    ))}
  </span>
);

export type { LibraryLinksProps };
export { LibraryLinks };
