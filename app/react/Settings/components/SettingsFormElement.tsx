import React from 'react';
import { Translate } from 'app/I18N';
import { Tip } from 'app/Layout';

import { SettingsLabel } from './SettingsLabel';

interface ComponentProps {
  label: string;
  tip?: React.ReactNode;
  children: React.ReactNode;
}

const SettingsFormElement = ({ label, tip, children }: ComponentProps) => (
  <div className="form-element row">
    <SettingsLabel className="col-xs-2">
      <Translate>{label}</Translate>
      {tip && <Tip icon="info-circle">{tip}</Tip>}
    </SettingsLabel>
    <div className="form-element-inputs col-xs-10">{children}</div>
  </div>
);
export { SettingsFormElement };
