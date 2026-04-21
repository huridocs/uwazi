import React from 'react';
import { MetadataFieldProps } from './types.js';
import { CountryFlag } from '../CustomIcons/index.js';
import { PropertyLabel } from './Components/PropertyLabel.js';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
};

const Title = ({ title, label, iconId, translationContext }: TitleProps) => (
  <>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel />
    </dt>
    <dd className="font-bold text-gray-900">
      <span className="flex flex-row flex-nowrap gap-2 align-middle">
        {iconId && <CountryFlag id={iconId} />}
        {title}
      </span>
    </dd>
  </>
);

export { Title };
