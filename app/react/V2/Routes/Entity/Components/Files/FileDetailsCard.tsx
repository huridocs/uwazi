import React from 'react';
import { Translate } from '#app/I18N/index.js';

const FileDetailsCard = ({
  headerAction,
  children,
}: {
  headerAction: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-3 rounded-md bg-warm p-4">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>File details</Translate>
      </div>
      {headerAction}
    </div>
    {children}
  </div>
);

export { FileDetailsCard };
