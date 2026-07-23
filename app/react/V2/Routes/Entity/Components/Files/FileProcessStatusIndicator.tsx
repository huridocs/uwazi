import React from 'react';
import { t, Translate } from '#app/I18N/index.js';
import { StatusBadge, UwaziLoader } from '#V2/Components/UI/index.js';
import { FileProcessStatus } from './types.js';

const FileProcessStatusIndicator = ({ status }: { status?: FileProcessStatus }) => {
  if (status === 'processing') {
    return (
      <span
        className="inline-flex shrink-0 items-center gap-1"
        title={t('System', 'Processing', null, false)}
      >
        <UwaziLoader size="xs" color="carbon" animate />
        <span className="sr-only">
          <Translate>Processing</Translate>
        </span>
      </span>
    );
  }

  if (status === 'failed') {
    return <StatusBadge label={t('System', 'Failed', null, false)} tone="seal" />;
  }

  return null;
};

export { FileProcessStatusIndicator };
