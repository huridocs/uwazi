import React, { type ReactNode } from 'react';
import { EntityIcon, type EntityIconData } from '#V2/Components/CustomIcons/EntityIcon.js';

type EntityTitleProps = {
  icon?: EntityIconData | null;
  children: ReactNode;
  className?: string;
};

const EntityTitle = ({ icon, children, className = '' }: EntityTitleProps) => (
  <span className={`flex min-w-0 items-start gap-1.5 ${className}`}>
    <EntityIcon data={icon} className="mt-px shrink-0" />
    {children}
  </span>
);

export { EntityTitle };
