import React from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';
import { CountryFlag } from '../CustomIcons';

type TitleProps = MetadataFieldProps & {
  title: string;
  iconId?: string;
};

const Title = ({ title, label, iconId, templateId }: TitleProps) => (
  <div>
    <dt className="sr-only">
      <Translate context={templateId}>{label}</Translate>
    </dt>
    <span className="flex flex-row flex-nowrap gap-2 align-middle">
      {iconId && <CountryFlag id={iconId} />}
      <dd className="font-bold text-gray-900">{title}</dd>
    </span>
  </div>
);

export { Title };
