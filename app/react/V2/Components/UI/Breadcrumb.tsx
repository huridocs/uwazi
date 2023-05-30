/* eslint-disable react/no-multi-comp */
import { ChevronRightIcon } from '@heroicons/react/20/solid';
import React, { PropsWithChildren } from 'react';
import { Link } from 'react-router-dom';
import { Translate } from 'app/I18N';

type BreadcrumbProps = PropsWithChildren & {
  url: string;
  className: string;
};

const Breadcrumb = ({ children }: PropsWithChildren) => (
  <nav className="!relative flex right-0 h-4 !bg-transparent m-0 !w-full" aria-label="Breadcrumb">
    <ol className="inline-flex items-center space-x-1">{children}</ol>
  </nav>
);

const Item = ({ children, url, className }: BreadcrumbProps) => (
  <li className={`inline-flex items-center ${className}`}>
    <Link
      to={url}
      className="inline-flex items-center ml-0 text-base font-medium text-gray-700 truncate w-60 sm:gap-6 hover:text-blue-600 hover:underline dark:text-gray-400 dark:hover:text-white"
    >
      {children}
    </Link>
    <ChevronRightIcon className="w-12 pl-1 md:w-8" />
    <span className="sr-only">
      <Translate>Navigate back</Translate>
    </span>
  </li>
);

Breadcrumb.Item = Item;

export { Breadcrumb };
