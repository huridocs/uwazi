import React from 'react';
import type { LibraryViewMode } from '../../libraryUrlState.js';
import { CardViewer } from './CardViewer.js';
import { MapViewer } from './MapViewer.js';
import { TableViewer } from './TableViewer.js';
import { TimelineViewer } from './TimelineViewer.js';
import type { LibraryViewerProps } from './types.js';

type LibraryViewerHostProps = Omit<LibraryViewerProps, 'layout'> & {
  view: LibraryViewMode;
};

const LibraryViewerHost = ({ view, ...viewerProps }: LibraryViewerHostProps) => {
  switch (view) {
    case 'map':
      return <MapViewer />;
    case 'table':
      return <TableViewer />;
    case 'timeline':
      return <TimelineViewer />;
    case 'list':
      return <CardViewer {...viewerProps} layout="list" />;
    case 'cards':
    default:
      return <CardViewer {...viewerProps} layout="cards" />;
  }
};

export type { LibraryViewerHostProps };
export { LibraryViewerHost };
