import React from 'react';
import type { LibraryViewMode } from '../../libraryUrlState.js';
import { CardViewer } from './CardViewer.js';
import { MapViewer } from './MapViewer.js';
import { TableViewer } from './TableViewer.js';
import type { LibraryViewerProps } from './types.js';

type LibraryViewerHostProps = LibraryViewerProps & {
  view: LibraryViewMode;
};

const LibraryViewerHost = ({ view, ...viewerProps }: LibraryViewerHostProps) => {
  switch (view) {
    case 'map':
      return <MapViewer {...viewerProps} />;
    case 'table':
      return <TableViewer {...viewerProps} />;
    case 'cards':
    default:
      return <CardViewer {...viewerProps} />;
  }
};

export type { LibraryViewerHostProps };
export { LibraryViewerHost };
