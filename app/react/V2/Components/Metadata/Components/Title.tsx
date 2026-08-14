import React from 'react';
import { PropertyLabel } from './PropertyLabel.js';
import { MetadataFieldProps } from './MetadataFieldPropsType.js';
import { EntityIcon, type EntityIconData } from '../../CustomIcons/EntityIcon.js';

type TitleProps = MetadataFieldProps & {
  title: string;
  icon?: EntityIconData | null;
  variant?: 'inline' | 'stacked';
};

const Title = ({ title, label, icon, translationContext, variant = 'inline' }: TitleProps) =>
  variant === 'stacked' ? (
    <>
      <dt>
        <PropertyLabel label={label} translationContext={translationContext} hideLabel />
      </dt>
      <dd className="min-w-0 w-full text-sm font-bold text-ink">
        <span className="flex min-w-0 flex-row flex-wrap items-start gap-2">
          <EntityIcon data={icon} />
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
          <EntityIcon data={icon} />
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
