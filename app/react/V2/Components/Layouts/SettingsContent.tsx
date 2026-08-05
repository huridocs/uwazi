/* eslint-disable react/no-multi-comp */
import React, { PropsWithChildren } from 'react';
import { Breadcrumb } from 'flowbite-react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Translate, I18NLinkV2 as I18NLink } from '#app/I18N/index.js';

interface SettingsContentProps extends PropsWithChildren {
  className?: string;
}

interface SettingsContentFooterProps extends SettingsContentProps {
  highlighted?: boolean;
}

interface SettingsHeaderProps extends PropsWithChildren {
  title?: string | React.ReactNode;
  contextId?: string;
  className?: string;
  path?: Map<string, string>;
}

const SettingsContent = ({ children, className }: SettingsContentProps) => (
  <div
    className={`${className || ''} flex flex-col h-full pb-14 lg:pb-0 bg-parchment`}
    data-testid="settings-content"
  >
    {children}
  </div>
);

const SettingsHeaderTitle = ({
  title,
  contextId,
}: {
  title: string | React.ReactNode;
  contextId?: string;
}) => {
  if (typeof title === 'string') {
    return (
      <Translate context={contextId || 'System'} className="max-w-xs truncate text-ink-secondary">
        {title}
      </Translate>
    );
  }

  return title;
};

const breadcrumbItemTheme = {
  chevron: 'mx-1 h-4 w-4 text-ink-tertiary group-first:hidden md:mx-2',
  href: {
    off: 'flex items-center text-sm font-medium text-ink-secondary',
    on: 'flex items-center text-sm font-medium text-ink-secondary hover:text-ink',
  },
};

const SettingsHeader = ({ contextId, title, children, path, className }: SettingsHeaderProps) => (
  <div
    className={`${className || ''} flex pt-5 pb-4 px-4 bg-parchment`}
    data-testid="settings-content-header"
  >
    <I18NLink to="/settings" className="block lg:hidden">
      <ChevronLeftIcon className="w-8 stroke-1 lg:hidden" />
      <span className="sr-only">
        <Translate>Navigate back</Translate>
      </span>
    </I18NLink>
    <Breadcrumb className="relative! p-1 flex right-0 bg-transparent! m-0 w-full! flex-wrap align-middle">
      {Array.from(path?.entries() || []).map(([key, value]) => (
        <Breadcrumb.Item key={key} className="max-w-xs" theme={breadcrumbItemTheme}>
          <I18NLink to={value} activeClassname="font-medium text-ink hover:text-ink">
            <Translate className="max-w-xs truncate text-ink-secondary hover:underline hover:text-ink">
              {key}
            </Translate>
          </I18NLink>
        </Breadcrumb.Item>
      ))}
      {title !== undefined && (
        <Breadcrumb.Item theme={breadcrumbItemTheme}>
          <SettingsHeaderTitle title={title} contextId={contextId} />
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
    {children}
  </div>
);

SettingsContent.Header = SettingsHeader;
SettingsContent.Body = ({ children, className }: SettingsContentProps) => (
  <div className={`${className || ''} grow px-4 bg-parchment`} data-testid="settings-content-body">
    {children}
  </div>
);

SettingsContent.Footer = ({
  children,
  className = '',
  highlighted = false,
}: SettingsContentFooterProps) => (
  <div
    className={[
      'sticky bottom-0 left-0 z-1 w-full border-t px-4 py-3',
      'border-t-[color-mix(in_srgb,var(--color-theme-border-default)_40%,transparent)]',
      highlighted ? 'bg-(--color-theme-feedback-info-tint)' : 'bg-parchment',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    data-testid="settings-content-footer"
  >
    {children}
  </div>
);
export { SettingsContent };
