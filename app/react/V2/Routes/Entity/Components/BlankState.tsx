/* eslint-disable react/no-multi-comp */
import React from 'react';
import type { ReactNode } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Translate } from 'app/I18N';

type BlankStateProps = {
  icon: ReactNode;
  title: ReactNode;
  description: ReactNode;
};

const BlankState = ({ icon, title, description }: BlankStateProps) => (
  <div className="flex flex-col items-center justify-center h-full text-center border border-dashed border-gray-200 rounded-2xl text-gray-500 gap-2 px-4">
    <p className="font-semibold text-lg">{title}</p>
    {icon}
    <p className="text-sm text-gray-400 w-4/6">{description}</p>
  </div>
);

const NoSearch = () => (
  <BlankState
    icon={<MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
    title={<Translate>Search text</Translate>}
    description={
      <Translate translationKey="Search text description">Search text description</Translate>
    }
  />
);

const NoResults = () => (
  <BlankState
    icon={<MagnifyingGlassIcon className="h-7 w-7 text-gray-900 rounded-full bg-gray-300 p-1" />}
    title={<Translate>No text match</Translate>}
    description={
      <Translate translationKey="No text match description">No text match description</Translate>
    }
  />
);

export { BlankState, NoSearch, NoResults };
