import React from 'react';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { CountryFlag } from '../../CustomIcons/CoutryFlags.js';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
  variant?: 'inline' | 'stacked';
};

const Title = ({ title, label, iconId, translationContext, variant = 'inline' }: TitleProps) =>
  variant === 'stacked' ? (
    <>
      <dt>
        <PropertyLabel label={label} translationContext={translationContext} hideLabel />
      </dt>
      <dd className="min-w-0 w-full text-sm font-bold text-ink">
        <span className="flex min-w-0 flex-row flex-wrap items-start gap-2">
          {iconId ? <CountryFlag id={iconId} /> : null}
          <span className="min-w-0 flex-1 whitespace-normal wrap-break-word" no-translate="true">
            {title}
          </span>
        </span>
      </dd>
    </>
  ) : (
    <>
      <dt>
        <PropertyLabel label={label} translationContext={translationContext} hideLabel />
      </dt>
      <dd className="min-w-0 flex-1 text-sm font-bold text-ink">
        <span className="flex min-w-0 flex-1 flex-nowrap items-center gap-2">
          {iconId ? <CountryFlag id={iconId} /> : null}
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className="block w-full truncate" no-translate="true">
              {title}
            </span>
          </span>
        </span>
      </dd>
    </>
  );

export { Title };
