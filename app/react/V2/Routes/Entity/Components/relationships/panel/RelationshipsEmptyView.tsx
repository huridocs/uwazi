import React, { type ReactNode } from 'react';
import { LinkIcon } from '@heroicons/react/24/outline';

type RelationshipsEmptyViewProps = {
  children: ReactNode;
  className?: string;
};

const RelationshipsEmptyView = ({ children, className = 'py-16' }: RelationshipsEmptyViewProps) => (
  <div className={`flex flex-col items-center justify-center text-center ${className}`.trim()}>
    <LinkIcon className="mb-3 h-9 w-9 text-ink-tertiary/40" />
    <p className="text-sm text-ink-tertiary">{children}</p>
  </div>
);

export { RelationshipsEmptyView };
