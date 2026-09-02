import React from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';
import { Translate } from '#app/I18N/index.js';
import { ViewerPlaceholder } from './ViewerPlaceholder.js';

const TimelineViewer = () => (
  <ViewerPlaceholder
    icon={<ClockIcon className="h-8 w-8 text-ink-muted" />}
    title={<Translate>Timeline</Translate>}
    description="Timeline view is not available yet."
  />
);

export { TimelineViewer };
