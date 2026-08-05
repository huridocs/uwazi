import React, { ReactNode } from 'react';

type BlankStateProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

const BlankState = ({ icon, title, description }: BlankStateProps) => (
  <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/40 p-8 text-center bg-paper">
    {icon}
    <p className="font-semibold text-lg">{title}</p>
    <p className="text-sm text-ink-muted">{description}</p>
  </div>
);

export { BlankState };
