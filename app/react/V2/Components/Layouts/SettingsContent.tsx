/* eslint-disable react/no-multi-comp */
import { Link } from 'react-router-dom';
import React, { PropsWithChildren } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { Breadcrumb } from 'flowbite-react';

interface SettingsContentProps extends PropsWithChildren {
  className?: string;
}

interface SettingsHeaderProps extends PropsWithChildren {
  title?: string;
  contextId?: string;
  className?: string;
  path?: Map<string, string>;
}

const SettingsContent = ({ children, className }: SettingsContentProps) => (
  <div className={`flex flex-col h-full p-5 ${className || ''}`} data-testid="settings-content">
    {children}
  </div>
);

const SettingsHeader = ({ contextId, title, children, path, className }: SettingsHeaderProps) => (
  <div className={`flex pb-4 ${className || ''}`} data-testid="settings-content-header">
    <Link to="/settings" className="block lg:hidden">
      <ChevronLeftIcon className="w-8 stroke-1 lg:hidden" />
    </Link>
    <Breadcrumb className="!relative flex right-0 h-4 !bg-transparent m-0 !w-full">
      {Array.from(path?.entries() || []).map(([key, value]) => (
        <Breadcrumb.Item href={value} className="max-w-xs">
          <Translate className="truncate hover:underline ">{key}</Translate>
        </Breadcrumb.Item>
      ))}
      {title !== undefined && (
        <Breadcrumb.Item className="max-w-xs">
          <Translate context={contextId || 'System'} className="truncate ">
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
  <div className={`${className || ''}`} data-testid="settings-content-body">
    {children}
  </div>
);

SettingsContent.Footer = ({ children, className }: SettingsContentProps) => (
  <div
    className={`fixed bottom-0 left-0 w-full p-1 bg-white border-t border-gray-200 lg:sticky z-1 ${
      className || ''
    }`}
  >
    {children}
  </div>
);
export { SettingsContent };
