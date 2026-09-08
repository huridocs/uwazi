import React from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ViewerPlaceholder } from './ViewerPlaceholder.js';

const MapViewer = () => (
  <ViewerPlaceholder
    icon={<MapIcon className="h-8 w-8 text-ink-muted" />}
    title={<Translate>Map</Translate>}
    description="Map view is not available yet."
  />
);

export { MapViewer };
