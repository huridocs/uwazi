import React from 'react';
import { iconNames } from '#UI/Icon/library.js';
import { CountryList } from '#app/UI/index.js';
import { Icon } from '#UI/Icon/Icon.jsx';
import { CountryFlag } from '#V2/Components/CustomIcons/CoutryFlags.js';
import type { SearchSelectGroup } from '#V2/Components/Forms/SearchSelect.js';

const iconSelectGroups: SearchSelectGroup[] = [
  {
    label: 'Icons',
    options: iconNames.map(name => ({
      value: `Icons:${name}`,
      searchLabel: name,
      label: name,
      prefix: <Icon icon={name} />,
    })),
  },
  {
    label: 'Flags',
    options: Array.from(CountryList).map(([, country]) => ({
      value: `Flags:${country.cca3}`,
      searchLabel: country.label,
      label: country.label,
      prefix: <CountryFlag id={country.cca3} />,
    })),
  },
];

export { iconSelectGroups };
