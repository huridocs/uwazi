import React from 'react';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';

interface HeaderProps {
  children: React.ReactNode | string;
  backUrl?: string;
}

const Breadcrumb = ({ children, backUrl }: HeaderProps) => (
  <div className="flex items-center">
    {backUrl && (
      <Link to={backUrl} className="block lg:hidden">
        <div className="flex mr-3">
          <svg
            className="w-6 h-6"
            aria-hidden="true"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M15.75 19.5L8.25 12l7.5-7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="sr-only">
            <Translate>Navigate back</Translate>
          </span>
        </div>
      </Link>
    )}
    {children}
  </div>
);

export { Breadcrumb };
