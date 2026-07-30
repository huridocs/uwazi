import React, { PropsWithChildren, ReactNode } from 'react';

type MetadataCardProps = PropsWithChildren<{
  title?: ReactNode;
  icon?: ReactNode;
  className?: string;
}>;

const MetadataCard = ({ title, icon, children, className = '' }: MetadataCardProps) => (
  <div
    className={`overflow-hidden rounded-lg border border-border-40 bg-paper ${className}`.trim()}
  >
    <div className="flex flex-col gap-3 px-4 py-3">
      {title != null && (
        <div className="flex items-center gap-1.5">
          {icon}
          <h4 className="text-sm font-bold leading-tight text-ink">{title}</h4>
        </div>
      )}
      {children}
    </div>
  </div>
);

export { MetadataCard };
