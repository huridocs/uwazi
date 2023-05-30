/* eslint-disable react/no-multi-comp */
import { useNavigate } from 'react-router-dom';
import React, { PropsWithChildren } from 'react';

interface SettingsContentProps extends PropsWithChildren {
  className?: string;
}

const SettingsContent = ({ children, className }: SettingsContentProps) => (
  <div className={`flex flex-col h-full p-5 ${className || ''}`} data-testid="settings-content">
    {children}
  </div>
);

const SettingsHeader = ({ children, className }: SettingsContentProps) => {
  const navigate = useNavigate();
  return (
    <div className={`flex pb-4 ${className || ''}`} data-testid="settings-content-header">
      <nav className="flex" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <a
              href="#"
              className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 dark:text-gray-400 dark:hover:text-white"
            >
              <svg
                aria-hidden="true"
                className="w-4 h-4 mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              Home
            </a>
          </li>
          <li>
            <div className="flex items-center">
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <a
                href="#"
                className="ml-1 text-sm font-medium text-gray-700 hover:text-blue-600 md:ml-2 dark:text-gray-400 dark:hover:text-white"
              >
                Projects
              </a>
            </div>
          </li>
          <li aria-current="page">
            <div className="flex items-center">
              <svg
                aria-hidden="true"
                className="w-6 h-6 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2 dark:text-gray-400">
                Flowbite
              </span>
            </div>
          </li>
        </ol>
      </nav>
    </div>
  );
};

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
