import React, { type ComponentType, type SVGProps } from 'react';

type MetaRowProps = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: React.ReactNode;
  value: React.ReactNode;
  valueLayout?: 'inline' | 'full';
};

const valueClassName = 'min-w-0 w-full text-xs leading-relaxed text-ink-secondary';

const MetaRow = ({ icon: Icon, label, value, valueLayout = 'inline' }: MetaRowProps) => {
  const content = value || '—';

  if (valueLayout === 'full') {
    return (
      <div className="flex w-full flex-col gap-1">
        <div className="flex items-start gap-2.5">
          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
          <span className="text-micro leading-tight text-ink-tertiary">{label}</span>
        </div>
        <div className={valueClassName}>{content}</div>
      </div>
    );
  }

  return (
    <div className="flex w-full items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-tertiary" strokeWidth={1.75} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-micro leading-tight text-ink-tertiary">{label}</span>
        <div className={valueClassName}>{content}</div>
      </div>
    </div>
  );
};

export { MetaRow };
