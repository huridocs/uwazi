import React from 'react';
import { Translate } from '#app/I18N/index.js';

const FileDetailsCard = ({
  headerAction,
  children,
}: {
  headerAction: React.ReactNode;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between">
      <div className="text-xs font-semibold uppercase tracking-wider text-ink-tertiary">
        <Translate>File details</Translate>
      </div>
      {headerAction}
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </div>
);

export { FileDetailsCard };
