import React from 'react';
import { MetadataFieldProps } from '#V2/Components/Metadata/types.js';
import { CountryFlag } from '#V2/Components/CustomIcons/index.js';
import { PropertyLabel } from '#V2/Components/Metadata/PropertyLabel.jsx';

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
