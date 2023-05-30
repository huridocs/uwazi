/* eslint-disable react/no-multi-comp */
import { Link } from 'react-router-dom';
import React, { PropsWithChildren } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/20/solid';
import { Translate } from 'app/I18N';
import { Breadcrumb } from '../UI';

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
    <Breadcrumb>
      <Link to="/settings" className="block lg:hidden">
        <ChevronLeftIcon className="h-7 lg:hidden" />
      </Link>
      {Array.from(path?.entries() || []).map(([key, value]) => (
        <Breadcrumb.Item url={value} className="w-32 md:w-52">
          <Translate className="truncate ">{key}</Translate>
        </Breadcrumb.Item>
      ))}
      {title !== undefined && (
        <span className="inline-flex items-center w-32 m-0 text-base font-medium text-gray-700 sm:gap-6 600 dark:text-gray-400 md:w-60 ">
          <Translate context={contextId || 'System'} className="truncate ">
            {title}
          </Translate>
        </span>
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
