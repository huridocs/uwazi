/* eslint-disable react/no-multi-comp */
import { Link } from 'react-router-dom';
import React, { PropsWithChildren } from 'react';
import { Breadcrumb } from 'flowbite-react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';

interface SettingsContentProps extends PropsWithChildren {
  className?: string;
}

interface SettingsContentFooterProps extends SettingsContentProps {
  highlighted?: boolean;
}

interface SettingsHeaderProps extends PropsWithChildren {
  title?: string;
  contextId?: string;
  className?: string;
  path?: Map<string, string>;
}

const SettingsContent = ({ children, className }: SettingsContentProps) => (
  <div
    className={`${className || ''} flex flex-col h-full pb-14 lg:pb-0`}
    data-testid="settings-content"
  >
    {children}
  </div>
);

const SettingsHeader = ({ contextId, title, children, path, className }: SettingsHeaderProps) => (
  <div className={`${className || ''} flex pt-5 pb-4 px-4 `} data-testid="settings-content-header">
    <Link to="/settings" className="block lg:hidden">
      <ChevronLeftIcon className="w-8 stroke-1 lg:hidden" />
      <span className="sr-only">
        <Translate>Navigate back</Translate>
      </span>
    </Link>
    <Breadcrumb className="!relative p-1 flex right-0 !bg-transparent m-0 !w-full flex-wrap align-middle">
      {Array.from(path?.entries() || []).map(([key, value]) => (
        <Breadcrumb.Item key={key} href={value} className="max-w-xs">
          <Translate className="max-w-xs truncate hover:underline">{key}</Translate>
        </Breadcrumb.Item>
      ))}
      {title !== undefined && (
        <Breadcrumb.Item className="max-w-xs">
          <Translate context={contextId || 'System'} className="max-w-xs truncate">
            {title}
          </Translate>
        </Breadcrumb.Item>
      )}
    </Breadcrumb>
    {children}
  </div>
);

SettingsContent.Header = SettingsHeader;
SettingsContent.Body = ({ children, className }: SettingsContentProps) => (
  <div className={`${className || ''} flex-grow px-4`} data-testid="settings-content-body">
    {children}
  </div>
);

SettingsContent.Footer = ({
  children,
  className = '',
  highlighted = false,
}: SettingsContentFooterProps) => (
  <div
    className={`bottom-0 left-0 w-full px-4 py-3 bg-white border-t border-gray-200 sticky z-1 ${
      highlighted ? 'bg-primary-50' : 'bg-white'
    } ${className}`}
    data-testid="settings-content-footer"
  >
    {children}
  </div>
);
export { SettingsContent };
