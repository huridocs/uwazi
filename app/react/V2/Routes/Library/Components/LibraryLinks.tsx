import React from 'react';
import type { LibraryLink } from './libraryTableCellValue.js';

const LibraryLinks = ({ links, className = '' }: { links: LibraryLink[]; className?: string }) => (
  <span
    title={links.map(link => link.label).join(', ')}
    className={`min-w-0 truncate text-ink ${className}`}
    onClick={event => event.stopPropagation()}
  >
    {links.map((link, index) => (
      <React.Fragment key={`${link.href}-${link.label}`}>
        {index > 0 ? ', ' : null}
        <a href={link.href} target="_blank" rel="noreferrer" className="underline">
          {link.label}
        </a>
      </React.Fragment>
    ))}
  </span>
);

export { LibraryLinks };
