import React from 'react';
import { Translate } from 'app/I18N';
import { MetadataFieldProps } from './types';

type TitleProps = MetadataFieldProps & {
  title: string;
  icon?: { _id: string; label: string; type: string };
};

const Title = ({ title, label, icon, templateId }: TitleProps) => (
  <div>
    <dt className="sr-only">
      <Translate context={templateId}>{label}</Translate>
    </dt>
    <dd className="font-bold text-gray-900">{title}</dd>
  </div>
);

export { Title };
