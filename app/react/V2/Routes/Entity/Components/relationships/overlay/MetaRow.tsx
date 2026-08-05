import React, { type ComponentType, type SVGProps } from 'react';

type MetaRowProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: React.ReactNode;
  value: React.ReactNode;
};

const MetaRow = ({ icon: Icon, label, value }: MetaRowProps) => (
  <div className="flex items-start gap-2.5">
    <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-micro leading-tight text-ink-tertiary">{label}</span>
      <p className="text-xs leading-relaxed text-ink-secondary">{value || '—'}</p>
    </div>
  </div>
);

export { MetaRow };
