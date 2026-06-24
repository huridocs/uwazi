import React, { type ReactNode } from 'react';

type EntityOverlaySectionProps = {
  title: ReactNode;
  action?: ReactNode;
  children: ReactNode;
};

const EntityOverlaySection = ({ title, action, children }: EntityOverlaySectionProps) => (
  <section className="flex flex-col gap-4 rounded-lg bg-warm p-4">
    <div className="flex items-center justify-between">
      <h4 className="text-[10px] font-semibold uppercase tracking-wider text-ink-tertiary">
        {title}
      </h4>
      {action}
    </div>
    <div className="flex flex-col gap-3">{children}</div>
  </section>
);

export { EntityOverlaySection };
