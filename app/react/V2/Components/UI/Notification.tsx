import React, { useState } from 'react';
import { Translate } from 'app/I18N';

interface NotificationProps {
  type: 'success' | 'info' | 'error';
  text: string | React.ReactNode;
  heading?: string | React.ReactNode;
  details?: string | React.ReactNode;
  dismissAction?: () => void;
}

const viewMoreIcons = {
  more: (
    <svg
      aria-hidden="true"
      className="-ml-0.5 mr-2 h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
      <path
        fillRule="evenodd"
        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
        clipRule="evenodd"
      />
    </svg>
  ),
  less: (
    <svg
      aria-hidden="true"
      className="-ml-0.5 mr-2 h-4 w-4"
      fill="currentColor"
      viewBox="0 0 20 20"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0
        000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374
        3.373l1.091 1.092a4 4 0 00-5.557-5.557z"
        clipRule="evenodd"
      />
      <path
        d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651
      0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z"
      />
    </svg>
  ),
};

const getIcon = (size: 'large' | 'small', type: 'success' | 'info' | 'error') => {
  const className = size === 'small' ? 'w-5 h-5' : 'w-7 h-7';
  return type === 'success' || type === 'info' ? (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75
        0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z"
        clipRule="evenodd"
      />
    </svg>
  ) : (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4
        3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd"
      />
    </svg>
  );
};

const Notification = ({
  type = 'success',
  text,
  heading,
  details,
  dismissAction,
}: NotificationProps) => {
  const [viewMore, setViewMore] = useState(false);

  let containerClass: string;
  let dismissClass: string;
  let viewMoreClass: string;
  let iconContainer: string;

  const onClick = () => {
    setViewMore(!viewMore);
  };

  switch (type) {
    case 'info':
      containerClass = 'text-primary-700 border-primary-300 bg-primary-100';
      dismissClass =
        'text-primary-800 border-primary-800 hover:bg-primary-900 focus:ring-primary-200';
      viewMoreClass = 'bg-primary-700 hover:bg-primary-800';
      iconContainer = 'bg-transparent';
      break;

    case 'error':
      containerClass = 'text-error-700 border-error-300 bg-white';
      dismissClass = 'text-error-800 border-error-800 hover:bg-error-900 focus:ring-error-200';
      viewMoreClass = 'bg-error-700 hover:bg-error-800';
      iconContainer = 'bg-error-100';
      break;

    default:
      containerClass = 'text-success-700 border-success-300 bg-white';
      dismissClass =
        'text-success-800 border-success-800 hover:bg-success-900 focus:ring-success-200';
      viewMoreClass = 'bg-success-700 hover:bg-success-800';
      iconContainer = 'bg-success-100';
      break;
  }

  return (
    <div
      className={`${containerClass} p-4 mb-4 border rounded-lg`}
      role="alert"
      data-testid="notifications-container"
    >
      {heading && (
        <div className="flex items-cente">
          {getIcon('small', type)}
          <h3 className="ml-2 text-lg font-medium">{heading}</h3>
        </div>
      )}
      {heading ? (
        <div className="mt-2 mb-4 text-sm">{text}</div>
      ) : (
        <div className="flex mb-4">
          <span className={`${iconContainer} border-0 rounded p-1 mr-2 align-top w-fit h-fit`}>
            {getIcon('large', type)}
          </span>
          <div className="text-sm">{text}</div>
        </div>
      )}
      {viewMore && <div className="mb-4 text-sm">{details}</div>}
      <div className="flex">
        <button
          type="button"
          className={`${dismissClass} bg-transparent border hover:text-white focus:ring-4 focus:outline-none 
          font-medium rounded-lg text-xs px-3 mr-2 py-1.5 text-center`}
          data-dismiss-target="#alert-additional-content-1"
          aria-label="Dismiss notification"
          onClick={dismissAction}
        >
          <Translate>Dismiss</Translate>
        </button>
        {details && (
          <button
            type="button"
            onClick={onClick}
            className={`${viewMoreClass} text-white focus:ring-4 focus:outline-none focus:ring-gray-300 
            font-medium rounded-lg text-xs px-3 py-1.5 text-center inline-flex items-center`}
          >
            {viewMore ? viewMoreIcons.less : viewMoreIcons.more}
            {viewMore ? <Translate>View less</Translate> : <Translate>View more</Translate>}
          </button>
        )}
      </div>
    </div>
  );
};

export type { NotificationProps };
export { Notification };
