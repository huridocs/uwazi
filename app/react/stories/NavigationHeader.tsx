import React from 'react';
import { Link } from 'react-router-dom';

interface HeaderProps {
  children: React.ReactNode | string;
  backUrl?: string;
}

const NavigationHeader = ({ children, backUrl }: HeaderProps) => (
  <div className="flex space-x-2 items-center">
    {backUrl && (
      <Link to={backUrl} className="block lg:hidden">
        <div className="flex space-x-1">
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
          <span className="sr-only">Go to previous page</span>
        </div>
      </Link>
    )}
    {children}
  </div>
);

export { NavigationHeader };
