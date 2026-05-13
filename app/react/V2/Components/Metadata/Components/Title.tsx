import React from 'react';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { CountryFlag } from '../../CustomIcons/CoutryFlags.js';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
};

const Title = ({ title, label, iconId, translationContext }: TitleProps) => (
  <>
    <dt>
      <PropertyLabel label={label} translationContext={translationContext} hideLabel />
    </dt>
    <dd className="min-w-0 flex-1 text-sm font-bold text-ink">
      <span className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-2">
        {iconId ? <CountryFlag id={iconId} /> : null}
        <span className="min-w-0 truncate" no-translate="true">
          {title}
        </span>
      </span>
    </dd>
  </>
);

export { Title };
