import React from 'react';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { MetadataLabel } from './MetadataLabel';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
};

const Title = ({ title, label, iconId, translationContext }: TitleProps) => (
  <div role="group">
    <MetadataLabel label={label} translationContext={translationContext} hideLabel />
    <span className="flex flex-row flex-nowrap gap-2 align-middle">
      {iconId && <CountryFlag id={iconId} />}
      <dd className="font-bold text-gray-900">{title}</dd>
    </span>
  </div>
);

export { Title };
