/* eslint-disable react/no-multi-comp */
import React from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { Translate } from '#app/I18N/index.js';
import { BlankState } from '#app/V2/Components/UI/index.js';

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

export { NoSearch, NoResults };
