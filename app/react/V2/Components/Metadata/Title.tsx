import React from 'react';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';
import { MetadataLabel } from './MetadataLabel';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
};

const Title = ({ title, label, iconId, translationContext }: TitleProps) => (
  <>
    <MetadataLabel label={label} translationContext={translationContext} hideLabel />
    <dd className="font-bold text-gray-900">
      <span className="flex flex-row flex-nowrap gap-2 align-middle">
        {iconId && <CountryFlag id={iconId} />}
        {title}
      </span>
    </dd>
  </>
);

export { Title };
