import React from 'react';
import { Translate } from 'app/I18N';
import { Tip } from 'app/Layout';

import { SettingsLabel } from './SettingsLabel';

export type ComponentProps = {
  label: string;
  children: React.ReactNode;
  tip?: React.ReactNode;
  labelClassName?: string;
  inputsClassName?: string;
};

const SettingsFormElement = ({
  label,
  tip,
  labelClassName = 'col-xs-12 col-lg-2',
  inputsClassName = 'col-xs-12 col-lg-10',
  children,
}: ComponentProps) => (
  <div className="form-element row">
    <SettingsLabel className={labelClassName}>
      <Translate>{label}</Translate>
      {tip && <Tip icon="info-circle">{tip}</Tip>}
    </SettingsLabel>
    <div className={`form-element-inputs ${inputsClassName}`}>{children}</div>
  </div>
);

export { SettingsFormElement };
